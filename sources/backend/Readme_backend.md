# **BACKEND**
-------------------
## 1. Instalación de programas necesarios
### 1.1. Descargar e instalar python del sitio oficial
    https://www.python.org/
Verificamos que python esté instalado usando el siguiente comando en la consola de línea de comandos:

    python --version
    
Si nos sale la versión significa que está instalado correctamente.
### 1.2. Descargar e instalar Visual Studio Code del sitio oficial
    https://code.visualstudio.com/
### 1.3. Descargar e instalar  Postgresql del sitio oficial
Para este caso, estamos usando la versión 17 de postgresql.

    https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
    
## 2. Preparar Postgresql:
### 2.1. Añadir variable de entorno
Una vez que tenemos instalado postgresql, añádelo a tus variables de entorno, para ello accede a las variables de entorno de Windows y en la sección "editar variables de entorno" agregas al PATH la ruta en la que se encuentra la carpeta "bin" de Postgresql. 
**Por ejemplo:**

    C:\Program Files\PostgreSQL\17\bin

### 2.2. Crear base de datos con Postgresql
2.2.1. Ejecutamos la consola de Postgresql: SQL Shell (psql), la cual se debería encontrar en la ruta en la que instaló postgresql.
**Por ejemplo:**

     C:\Program Files\PostgreSQL\17\scripts\runpsql.bat

2.2.2. En la consola, dejaremos las opciones por defecto y colocaremos una contraseña (revisar la contraseña del .env):
    
    Server [localhost]:
    Database [postgres]:
    Port [5432]:
    Username [postgres]:
    Contraseña para usuario postgres:

2.2.3. En la consola, creamos la base de datos para el sistema con el siguiente comando:

    create database potia;

Luego, ejecutamos el comando:

    \l
El cual nos mostrará la lista de bases de datos, si en ella sale la base de datos que acabamos de crear, significa que todo salió correctamente.

## 3. Sockets:
Ubicar la consola CMD en la ubicación del backend y correr el siguiente comando:

    uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload


