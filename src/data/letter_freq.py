'''
This script calculates frequencies for characters based off
of the provided word list and then writes to 
the letter_percents.json file.
'''
import json

with open('fives.json') as file:
    words = json.load(file)

counts = {}
total = 5 * len(words)
for word in words:
    for char in word:
        if char not in counts:
            counts[char] = 1
        else:
            counts[char] += 1

percents = {}
for char in counts:
    percents[char] = counts[char] / total

print(f'Percents: {percents}')
print(len(counts))
print(f'Total: {total}')

# ranking = sorted(percents, key=lambda x: percents[x], reverse=True)

with open('letter_percents.json', 'w') as file:
    json.dump(percents, file)
    print('FINISHED WRITING TO FILE')
