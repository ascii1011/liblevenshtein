# Copyright (c) 2012 Dylon Edwards
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

do ->
  'use strict'

  fs = require('fs'); lazy = require('lazy')
  new lazy(fs.createReadStream('/usr/share/dict/american-english', encoding: 'utf8')).lines.map((line) ->
    line && line.toString()
  ).join (dictionary) ->
    dictionary.splice(0,1) # discard the empty string ...

    {levenshtein} = require('../javascripts/v1.2/liblevenshtein')

    console.log ' ::: Constructing the dictionary dawg'

    dawg_start = new Date()
    dawg = new levenshtein.Dawg(dictionary)
    dawg_stop = new Date()

    console.log " ::: Time to construct dawg: #{dawg_stop - dawg_start} ms"

    console.log ' ::: Checking dawg for errors'

    # Sanity check: Make sure that every word in the dictionary is indexed.
    errors = []
    for term in dictionary
      unless dawg.accepts(term)
        errors.push(term)
    if errors.length > 0
      for term in errors
        console.log "    {!} \"#{term}\" ::= failed to encode in dawg"

    console.log '----------------------------------------'

    for algorithm in ['standard', 'transposition', 'merge_and_split']
      console.log " ::: Constructing the transducer for algorithm='#{algorithm}'"

      transduce_start = new Date()
      transduce = levenshtein.transducer(dictionary: dawg, algorithm: algorithm)
      transduce_stop = new Date()

      console.log " ::: Time to construct transducer: #{transduce_stop - transduce_start} ms"
      console.log " ::: Constructing the distance metric for algorithm='#{algorithm}'"

      distance_start = new Date()
      distance = levenshtein.distance(algorithm)
      distance_stop = new Date()

      console.log " ::: Time to construct distance metric: #{distance_stop - distance_start} ms"
      console.log '----------------------------------------'

      for word in ['correct', 'mispelled', 'oter', 'mien', 'clog', 'snoz', 'pleeze', 'urz']
        console.log " ::: Calculating distances for word='#{word}', algorithm='#{algorithm}'"

        distances_start = new Date()
        distance(word, term) for term in dictionary
        distances_stop = new Date()

        console.log " ::: Time to distance the dictionary: #{distances_stop - distances_start} ms"
        console.log '----------------------------------------'

        for n in [0..5]
          console.log " ::: Determining target words for n=#{n}, word='#{word}', algorithm='#{algorithm}'"

          target_terms = {}
          target_terms[term] = true for term in dictionary when distance(word, term) <= n

          console.log " ::: Transducing the dictionary for n=#{n}, word='#{word}', algorithm='#{algorithm}'"

          transduced_start = new Date()
          transduced = transduce(word, n)
          transduced_stop = new Date()

          console.log " ::: Time to transduce the dictionary: #{transduced_stop - transduced_start} ms"

          for [term, d] in transduced
            if distance(word, term) != d
              message = "    distance(\"#{word}\", \"#{term}\") = #{distance(word, term)} <=> #{d}"
              console.log(message)
              console.log '    ' + Array(message.length - 3).join('^')

          false_positives = []
          for [term] in transduced
            if term of target_terms
              delete target_terms[term]
            else
              false_positives.push(term)

          if false_positives.length > 0
            console.log ' ::: Distances to Every False Positive:'
            false_positives.sort (a,b) -> distance(word, a[0]) - distance(word, b[0]) || a[0].localeCompare(b[0])
            for term in false_positives
              console.log "    distance(\"#{word}\", \"#{term}\") = #{distance(word, term)}"
            console.log " ::: Total False Positives: #{false_positives.length}"

          false_negatives = []
          false_negatives.push(term) for term of target_terms

          if false_negatives.length > 0
            console.log ' ::: Distances to Every False Negative:'
            false_negatives.sort (a,b) -> distance(word, a[0]) - distance(word, b[0]) || a[0].localeCompare(b[0])
            for term in false_negatives
              console.log "    distance(\"#{word}\", \"#{term}\") = #{distance(word, term)}"
            console.log " ::: Total False Negatives: #{false_negatives.length}"
        console.log '----------------------------------------'
    return
  return

