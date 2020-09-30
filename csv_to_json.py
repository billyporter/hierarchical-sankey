#!/usr/bin/env python3


import csv
import sys
import argparse
import orjson

def main():
    parser = argparse.ArgumentParser(prog='csv_to_json')

    parser.add_argument('-p', '--path', help='Path of csv file', type=str, default='')

    # Help if no args
    if len(sys.argv) < 2:
        parser.print_help(sys.stderr)
        sys.exit(1)

    # Set args with argparse
    args = parser.parse_args()

    # initialize empty data dict
    data = {}

    # Open file and load csv data to the data dict
    with open(args.path, encoding='utf-8-sig') as csvf:
        csvReader = csv.DictReader(csvf)

        for row in csvReader:
            key = row['Anonymized Student ID']
            data[key] = row
            del data[key]['Anonymized Student ID']


    # Dump data in json format to stdout
    print(orjson.dumps(data).decode('utf-8'))

if __name__ == '__main__':
    main()