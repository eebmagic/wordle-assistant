'''
This file builds the frequency value for all words in the source
data file and outputs to the frequencies.json file.
'''
from wordfreq import word_frequency
import json

with open('fives.json') as file:
    words = json.load(file)

data = {}
s = 0
for word in words:
    f = word_frequency(word, 'en')
    s += f
    data[word] = f

print(f'Total: {s}')
print(f'Average: {s/len(words)}')

with open('frequencies.json', 'w') as file:
    json.dump(data, file)
    print('FINISHED WRITING TO FILE')
