#!/usr/bin/python3

import os
import json

def update_package():
    branch=os.environ.get('CIRCLE_BRANCH', 'na')
    build_number = os.environ.get('CIRCLE_BUILD_NUM', 'na')
    build_sha1 = os.environ.get('CIRCLE_SHA1', 'na')
    
    with open('package.json', 'r') as fo:
        package_data = json.load(fo)
    
    package_data['buildbranch'] = branch
    package_data['buildnum'] = build_number
    package_data['buildsha1'] = build_sha1
    
    with open('package.json', 'w') as fo:
        json.dump(package_data, fo)

if __name__ == '__main__':
    update_package()






