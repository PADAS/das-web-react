#!/usr/bin/python3

import os
import json

def update_package():
    branch=os.environ.get('BUILD_BRANCH', 'na')
    build_number = os.environ.get('BUILD_NUMBER', 'na')
    build_sha1 = os.environ.get('BUILD_SHA', 'na')
    
    with open('package.json', 'r') as fo:
        package_data = json.load(fo)
    
    package_data['buildbranch'] = branch
    package_data['buildnum'] = build_number
    package_data['buildsha1'] = build_sha1
    
    with open('package.json', 'w') as fo:
        json.dump(package_data, fo)

if __name__ == '__main__':
    update_package()






