CREATE DATABASE desfase;
USE desfase;

CREATE USER 'desfase'@'localhost' IDENTIFIED BY 'desfase';

GRANT ALL PRIVILEGES ON desfase.* TO 'desfase'@'localhost';

