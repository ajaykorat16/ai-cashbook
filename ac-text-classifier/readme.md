- Python 3.9.1
- pip install -r requirements.txt
# csv format

training file: (account, amount, date, category)
classification file: (account, amount, date)
NOTE: column can be in any order but it must have header.

# train model

main.py train {user_id} {path/to/file.csv}
main.py classify {user_id} {path/to/input.csv} {path/to/output.csv}
NOTE: output file is option if its not supplied output will be overwritten on input file

# test model

test_model.py ./data/test.csv
you can use any csv file with (account, amount, date, category)
it will return accuracy along with failed rows if any and execution time it takes to train and test.
