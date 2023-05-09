#!/bin/bash

# GDAL SCRIPT INSTALL
echo "GDAL Install..."
add-apt-repository ppa:ubuntugis/ppa && apt-get update
apt-get update
apt-get install gdal-bin
apt-get install libgdal-dev
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install GDAL

# Build the project
echo "Building the project..."
python3.9 -m pip install -r requirements.txt

echo "Make Migration..."
python3.9 manage.py makemigrations --noinput
python3.9 manage.py migrate --noinput

echo "Collect Static..."
python3.9 manage.py collectstatic --noinput --clear

echo "Load datas into DB"
python3.9 manage.py load online_mall_dump.json --noinput