#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
fabiana | ENTRENAMIENTO QWEN CON LORA (CPU)

Entrenamiento supervisado (SFT) utilizando:
- Qwen2.5-7B-Instruct (o modelos más pequeños recomendados para CPU)
- PEFT / LoRA en CPU (sin cuantización bitsandbytes CUDA)
- Hugging Face Transformers
- TRL SFTTrainer
- Dataset JSONL en formato messages

Nota de entorno: Ejecutándose en máquina virtual sobre CPU sin GPU asignada.
"""

import os
import json
import argparse
import random

import torch

from pathlib import Path
from datasets import Dataset
from transformers import (
	AutoTokenizer,
	AutoModelForCausalLM,
	set_seed,
)
from peft import (
	LoraConfig,
	get_peft_model,
)
from trl import SFTConfig, SFTTrainer


# CONFIGURACIÓN ####################################################

MODELO_DEFAULT = "Qwen/Qwen2.5-7B-Instruct"

DATOS_DEFAULT = "fabiana_entrenamiento.jsonl"

SALIDA_DEFAULT = "./qwen-fabiana-lora"

EPOCAS_DEFAULT = 3

SEMILLA = 42

MAX_LENGTH = 256

BATCH_SIZE = 1

GRADIENT_ACCUMULATION = 4

LORA_R = 4

LORA_ALPHA = 8

LORA_DROPOUT = 0.05

LEARNING_RATE = 2e-4

VALIDACION = 0.10


# ARGUMENTOS #######################################################

def argumentos():

	parser = argparse.ArgumentParser(
		description="fabiana | Entrenamiento Qwen LoRA (CPU)"
	)

	parser.add_argument(
		"--datos",
		default=DATOS_DEFAULT,
		help="Archivo JSONL de entrenamiento"
	)

	parser.add_argument(
		"--modelo",
		default=MODELO_DEFAULT,
		help="Modelo base de Hugging Face"
	)

	parser.add_argument(
		"--salida",
		default=SALIDA_DEFAULT,
		help="Directorio del adaptador LoRA"
	)

	parser.add_argument(
		"--epocas",
		type=int,
		default=EPOCAS_DEFAULT,
		help="Número de épocas"
	)

	parser.add_argument(
		"--max-length",
		type=int,
		default=MAX_LENGTH,
		help="Longitud máxima de secuencia"
	)

	return parser.parse_args()


# COMPROBAR ENTORNO ################################################

def comprobar_entorno():

	print("=" * 65)
	print("fabiana | ENTRENAMIENTO QWEN LORA (MODO CPU)")
	print("=" * 65)

	hilos = torch.get_num_threads()
	print(f"Dispositivo: CPU")
	print(f"Hilos de CPU asignados a PyTorch: {hilos}")
	print("=" * 65)

	print("AVISO: El entrenamiento por CPU es extremadamente lento.")
	print("Para pruebas prácticas se recomienda usar modelos pequeños (ej. Qwen2.5-1.5B-Instruct).")

	print("=" * 65)


# CARGAR JSONL #####################################################

def cargar_jsonl(ruta):

	ruta = Path(ruta)

	if not ruta.exists():
		raise FileNotFoundError(
			f"No existe el dataset: {ruta}"
		)

	registros = []

	with ruta.open("r", encoding="utf-8") as archivo:

		for numero, linea in enumerate(archivo, 1):

			linea = linea.strip()

			if not linea:
				continue

			try:
				registro = json.loads(linea)
			except json.JSONDecodeError as error:
				raise ValueError(
					f"JSON incorrecto en línea {numero}: {error}"
				)

			mensajes = registro.get("messages")

			if not isinstance(mensajes, list):
				raise ValueError(
					f"Línea {numero}: falta 'messages'"
				)

			if not mensajes:
				raise ValueError(
					f"Línea {numero}: lista messages vacía"
				)

			for mensaje in mensajes:

				if not isinstance(mensaje, dict):
					raise ValueError(
						f"Línea {numero}: mensaje incorrecto"
					)

				if mensaje.get("role") not in (
					"system",
					"user",
					"assistant",
				):
					raise ValueError(
						f"Línea {numero}: rol no válido"
					)

				if not isinstance(
					mensaje.get("content"), str
				):
					raise ValueError(
						f"Línea {numero}: contenido incorrecto"
					)

			if not any(
				m["role"] == "assistant"
				for m in mensajes
			):
				raise ValueError(
					f"Línea {numero}: no hay respuesta assistant"
				)

			registros.append({
				"messages": mensajes
			})

	if len(registros) < 2:
		raise ValueError(
			"Se necesitan al menos dos registros."
		)

	print(f"Registros cargados: {len(registros)}")

	return registros


# DIVIDIR DATASET ##################################################

def dividir_dataset(registros):

	random.Random(SEMILLA).shuffle(registros)

	total = len(registros)

	cantidad_validacion = max(
		1,
		int(total * VALIDACION)
	)

	validacion = registros[:cantidad_validacion]

	entrenamiento = registros[cantidad_validacion:]

	print(f"Entrenamiento: {len(entrenamiento)}")
	print(f"Validación: {len(validacion)}")

	return (
		Dataset.from_list(entrenamiento),
		Dataset.from_list(validacion),
	)


# TOKENIZADOR ######################################################

def cargar_tokenizador(modelo):

	print("\nCargando tokenizador...")

	tokenizer = AutoTokenizer.from_pretrained(
		modelo,
		trust_remote_code=False,
	)

	if tokenizer.pad_token is None:
		tokenizer.pad_token = tokenizer.eos_token

	tokenizer.padding_side = "right"

	return tokenizer


# CARGAR MODELO CPU ################################################

def cargar_modelo(nombre):

	print("\nCargando modelo base en CPU (float32 / bfloat16)...")
	print(f"Modelo: {nombre}")

	# En CPU cargamos directamente en float32 o bfloat16 si la CPU lo soporta
	modelo = AutoModelForCausalLM.from_pretrained(
		nombre,
		torch_dtype=torch.float32,
		device_map="cpu",
		low_cpu_mem_usage=True,
		trust_remote_code=False,
	)

	modelo.config.use_cache = False

	print("Modelo cargado en memoria RAM.")

	return modelo


# CONFIGURACIÓN LORA ###############################################

def configurar_lora():

	return LoraConfig(
		r=LORA_R,
		lora_alpha=LORA_ALPHA,
		lora_dropout=LORA_DROPOUT,
		bias="none",
		task_type="CAUSAL_LM",
		target_modules=[
			"q_proj",
			"v_proj",
		],
	)


# CONFIGURACIÓN ENTRENAMIENTO ######################################

def configurar_entrenamiento(salida, epocas, max_length):

	return SFTConfig(
		output_dir=salida,

		num_train_epochs=epocas,

		per_device_train_batch_size=BATCH_SIZE,

		per_device_eval_batch_size=1,

		gradient_accumulation_steps=GRADIENT_ACCUMULATION,

		gradient_checkpointing=False, # Desactivado en CPU para evitar sobrecarga de cómputo

		learning_rate=LEARNING_RATE,

		lr_scheduler_type="cosine",

		warmup_ratio=0.05,

		weight_decay=0.01,

		optim="adamw_torch", # Optimizado para PyTorch CPU básico

		max_length=max_length,

		packing=False,

		completion_only_loss=True,

		bf16=False,

		fp16=False,

		use_cpu=True,

		eval_strategy="epoch",

		save_strategy="epoch",

		save_total_limit=2,

		logging_steps=1,

		logging_first_step=True,

		report_to="none",

		seed=SEMILLA,

		data_seed=SEMILLA,

		dataloader_num_workers=0,

		remove_unused_columns=False,
	)


# ENTRENAMIENTO ####################################################

def entrenar(args):

	set_seed(SEMILLA)

	comprobar_entorno()

	registros = cargar_jsonl(args.datos)

	dataset_train, dataset_eval = dividir_dataset(
		registros
	)

	tokenizer = cargar_tokenizador(args.modelo)

	modelo = cargar_modelo(args.modelo)

	lora = configurar_lora()

	configuracion = configurar_entrenamiento(
		args.salida,
		args.epocas,
		args.max_length,
	)

	print("\nPreparando entrenador...")

	trainer = SFTTrainer(
		model=modelo,
		args=configuracion,
		train_dataset=dataset_train,
		eval_dataset=dataset_eval,
		processing_class=tokenizer,
		peft_config=lora,
	)

	print("\nParámetros entrenables:")

	trainer.model.print_trainable_parameters()

	print("\n" + "=" * 65)
	print("INICIANDO ENTRENAMIENTO EN CPU")
	print("=" * 65)

	resultado = trainer.train()

	print("\nEntrenamiento terminado.")

	print(f"Train loss: {resultado.training_loss:.6f}")

	print("\nEvaluando modelo...")

	metricas = trainer.evaluate()

	print(
		json.dumps(
			metricas,
			indent=2,
			ensure_ascii=False,
		)
	)

	print("\nGuardando adaptador LoRA...")

	ruta_salida = Path(args.salida)

	ruta_salida.mkdir(
		parents=True,
		exist_ok=True,
	)

	trainer.save_model(str(ruta_salida))

	tokenizer.save_pretrained(str(ruta_salida))

	with (
		ruta_salida / "entrenamiento.json"
	).open("w", encoding="utf-8") as archivo:

		json.dump(
			{
				"modelo_base": args.modelo,
				"dataset": args.datos,
				"epocas": args.epocas,
				"max_length": args.max_length,
				"lora_r": LORA_R,
				"lora_alpha": LORA_ALPHA,
				"train_samples": len(dataset_train),
				"eval_samples": len(dataset_eval),
				"metricas": metricas,
			},
			archivo,
			indent=2,
			ensure_ascii=False,
			default=str,
		)

	print("\n" + "=" * 65)
	print("ENTRENAMIENTO FINALIZADO")
	print("=" * 65)

	print(f"Adaptador guardado en: {ruta_salida.resolve()}")

	print("\nArchivos principales:")
	print("  adapter_config.json")
	print("  adapter_model.safetensors")
	print("  tokenizer.json")
	print("  entrenamiento.json")


# PRINCIPAL ########################################################

if __name__ == "__main__":

	args = argumentos()

	try:
		entrenar(args)

	except KeyboardInterrupt:

		print("\nEntrenamiento interrumpido.")

	except Exception as error:

		print(f"\nERROR: {error}")

		raise
