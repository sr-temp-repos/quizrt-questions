#!/bin/bash
sudo apachectl stop
make clean
make all
if [ ! -e wd_server ]
then
exit $?
fi
while true; do
sudo ./wd_server ./wdq.config
echo "Uh-Oh"
done

