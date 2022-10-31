#!/bin/bash

# https://docs.codecov.com/docs/codecov-uploader
curl -Os https://uploader.codecov.io/latest/linux/codecov

chmod +x codecov
./codecov -t ${CODECOV_TOKEN}
