#!/bin/bash
PROJ_VERSION=8.2.1
PROJ_DATA_VERSION=1.10
GDAL_VERSION=3.3.3

# Build PROJ.4
wget https://download.osgeo.org/proj/proj-${PROJ_VERSION}.tar.gz
wget https://download.osgeo.org/proj/proj-data-${PROJ_DATA_VERSION}.tar.gz
tar xzf proj-${PROJ_VERSION}.tar.gz
cd proj-${PROJ_VERSION}/data
tar xzf ../../proj-data-${PROJ_DATA_VERSION}.tar.gz
cd ..
PKG_CONFIG_PATH=../sqlite-autoconf-${SQLITE_VERSION} ./configure --without-curl
make -j8
make install
cd ..

# Build GDAL
wget https://download.osgeo.org/gdal/${GDAL_VERSION}/gdal-${GDAL_VERSION}.tar.gz
tar xzf gdal-${GDAL_VERSION}.tar.gz
cd gdal-${GDAL_VERSION}
CPPFLAGS=-I$(pwd)/../proj-${PROJ_VERSION}/src LDFLAGS=-L$(pwd)/../proj-${PROJ_VERSION}/src/.libs ./configure \
  --with-hide-internal-symbols \
  --with-lerc=no \
  --with-pcraster=no \
  --with-qhull=no \
  --with-png=no \
  --with-jpeg=no \
  --with-gif=no \
  --disable-all-optional-drivers
make -j8
make install

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