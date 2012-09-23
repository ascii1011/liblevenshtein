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

LIST = 'list'
DAWG = 'dawg'

###*
The algorithm for imitating Levenshtein automata was taken from the
following journal article:

\@ARTICLE{Schulz02faststring,
  author = {Klaus Schulz and Stoyan Mihov},
  title = {Fast String Correction with Levenshtein-Automata},
  journal = {INTERNATIONAL JOURNAL OF DOCUMENT ANALYSIS AND RECOGNITION},
  year = {2002},
  volume = {5},
  pages = {67--85}
}

As well, this Master Thesis helped me understand its concepts:

  www.fmi.uni-sofia.bg/fmi/logic/theses/mitankin-en.pdf

The supervisor of the student who submitted the thesis was one of the
authors of the journal article, above.

The algorithm for constructing a DAWG (Direct Acyclic Word Graph) from the
input dictionary of words (DAWGs are otherwise known as an MA-FSA, or
Minimal Acyclic Finite-State Automata), was taken and modified from the
following blog from Steve Hanov:

  http://stevehanov.ca/blog/index.php?id=115

The algorithm therein was taken from the following paper:

\@MISC{Daciuk00incrementalconstruction,
  author = {Jan Daciuk and Bruce W. Watson and Richard E. Watson and Stoyan Mihov},
  title = {Incremental Construction of Minimal Acyclic Finite-State Automata},
  year = {2000}
}

@param {{
  dictionary: !(Array.<string>|Dawg),
  sorted: ?boolean,
  algorithm: ?string,
  sort_accepted: ?boolean,
  include_distance: ?boolean,
  case_insensitive: ?boolean
}}
###
transducer = (args) ->

  ###*
  Dictionary of words available to the transducer. These are what will be
  evaluated and returned, and may be specified as either an Array.<string> or a
  Dawg. If an Array.<string> is used as the dictionary, it will be converted to
  a Dawg; if the Array.<string> is not sorted, it will be sorted before being
  converted to a Dawg.

  @type {!(Array.<string>|Dawg)}
  ###
  dictionary = args['dictionary']

  ###*
  Specifies whether the dictionary is sorted. This is only useful when the
  dictionary is of type Array.<string>, and is ignored when it is of type Dawg.

  @type {?boolean}
  ###
  sorted = args['sorted']

  ###*
  Dictates which algorithm to use, whether it be "standard", "transposition", or
  "merge_and_split".  If unspecified, this will default to "standard".  The
  explanations of each type is given below:

  1. "standard" := Levenshtein distance, including insertions, deletions, and
    substitutions as elementary edit operations. This is the traditional edit
    distance metric.
  2. "transposition" := Levenshtein distance, including insertions, deletions,
    substitutions, and transpositions as elementary edit operations. This is
    useful, primarily, in typesetting applications.
  3. "merge_and_split" := Levenshtein distance, including insertions, deletions,
    substitutions, merges, and splits as elementary edit operations. This is
    useful, primarily, in OCR applications.

  @type {?string}
  ###
  algorithm = args['algorithm']

  ###*
  Whether to sort the terms accepted by the transducer. If left unspecified,
  this defaults to `true`.
  
  @type {?boolean}
  ###
  sort_accepted = args['sort_accepted']

  ###*
  Whether to include the distance metrics with the accepted terms. If left
  unspecified, this defaults to `true`.

  @type {?boolean}
  ###
  include_distance = args['include_distance']

  ###*
  Whether to sort the accepted terms in a case-insensitive manner. If left
  unspecified, this defaults to `true`.

  @type {?boolean}
  ###
  case_insensitive = args['case_insensitive']

  throw new Error('No dictionary was specified') unless dictionary
  unless dictionary instanceof Array or dictionary instanceof Dawg
    throw new Error('dictionary must be either an Array or levenshtein.Dawg')

  if sorted? and typeof sorted isnt 'boolean'
    throw new Error("expected 'sorted' to be of type 'boolean', received '#{typeof sorted}'")

  if algorithm? and (typeof algorithm isnt 'string' or algorithm not in [STANDARD, TRANSPOSITION, MERGE_AND_SPLIT])
    throw new Error("unsupported value of 'algorithm': '#{algorithm}'")

  if sort_accepted? and typeof sort_accepted isnt 'boolean'
    throw new Error("expected 'sort_accepted' to be of type 'boolean', received '#{typeof sort_accepted}'")

  if include_distance? and typeof include_distance isnt 'boolean'
    throw new Error("expected 'include_distance' to be of type 'boolean', received '#{typeof include_distance}'")

  if case_insensitive? and typeof case_insensitive isnt 'boolean'
    throw new Error("expected 'case_insensitive' to be of type 'boolean', received '#{typeof case_insensitive}'")

  sorted ?= false
  algorithm ?= STANDARD
  sort_accepted ?= true
  include_distance ?= true
  case_insensitive ?= true

  ###*
  Returns the first index corresponding to a `true` value within the
  characteristic vector, beginning at offset `i` and ending at `i + k`. The
  index begins at `0` for `i`, and ends at `k` for `i + k`.  If no element
  corresponds to a `true` value within the range `i` to `i + k`, the value `-1`
  is returned.

  @param {Array.<boolean>} vector Characteristic vector.
  @param {number} k Number of elements to examine.
  @param {number} i Offset of where to begin traversing the characteristic
    vector, which must be no greater than k.
  @return {number} The first index within the given range corresponding to
    `true`, or `-1` if none exists.
  ###
  index_of = (vector, k, i) ->
    j = 0
    while j < k
      return j if vector[i + j]
      j += 1
    return -1

  ###*
  Returns a position transition function, which maps positions into states
  according to the specified algorithm.

  @param {number} n Maximum allowed edit distance.
  @return {function(Array.<number>, Array.<boolean>, number) : Array.<Array,<number>>}
    The position transition function corresponding to the specified algorithm.
    The first parameter corresponds to the current position, the second
    corresponds to a characteristic vector at the minimal boundary of the
    current state, and the third is the offset with which to relabel the
    boundary of the current position.
  ###
  transition_for_position = switch algorithm
    when STANDARD then (n) ->
      ([i,e], vector, offset) ->
        h = i - offset; w = vector.length
        if e < n
          if h <= w - 2
            a = n - e + 1; b = w - h
            k = if a < b then a else b
            j = index_of(vector, k, h)
            if j == 0
              [
                [(i + 1), e]
              ]
            else if j > 0
              [
                [i, (e + 1)]
                [(i + 1), (e + 1)]
                [(i + j + 1), (e + j)]
              ]
            else
              [
                [i, (e + 1)]
                [(i + 1), (e + 1)]
              ]
          else if h == w - 1
            if vector[h]
              [
                [(i + 1), e]
              ]
            else
              [
                [i, (e + 1)]
                [(i + 1), (e + 1)]
              ]
          else # h == w
            [
              [i, (e + 1)]
            ]
        else if e == n
          if h <= w - 1
            if vector[h]
              [
                [(i + 1), n]
              ]
            else
              null
          else
            null
        else
          null

    when TRANSPOSITION then (n) ->
      ([i,e,t], vector, offset) ->
        h = i - offset; w = vector.length
        if e == 0 < n
          if h <= w - 2
            a = n - e + 1; b = w - h
            k = if a < b then a else b
            j = index_of(vector, k, h)
            if j == 0
              [
                [(i + 1), 0, 0]
              ]
            else if j == 1
              [
                [i, 1, 0]
                [i, 1, 1] # t-position
                [(i + 1), 1, 0]
                [(i + 2), 1, 0] # was [(i + j + 1), j, 0], but j=1
              ]
            else if j > 1
              [
                [i, 1, 0]
                [(i + 1), 1, 0]
                [(i + j + 1), j, 0]
              ]
            else
              [
                [i, 1, 0]
                [(i + 1), 1, 0]
              ]
          else if h == w - 1
            if vector[h]
              [
                [(i + 1), 0, 0]
              ]
            else
              [
                [i, 1, 0]
                [(i + 1), 1, 0]
              ]
          else # h == w
            [
              [i, 1, 0]
            ]
        else if 1 <= e < n
          if h <= w - 2
            if t is 0 # [i,e] is not a t-position
              a = n - e + 1; b = w - h
              k = if a < b then a else b
              j = index_of(vector, k, h)
              if j == 0
                [
                  [(i + 1), e, 0]
                ]
              else if j == 1
                [
                  [i, (e + 1), 0]
                  [i, (e + 1), 1] # t-position
                  [(i + 1), (e + 1), 0]
                  [(i + 2), (e + 1), 0] # was [(i + j + 1), (e + j), 0], but j=1
                ]
              else if j > 1
                [
                  [i, (e + 1), 0]
                  [(i + 1), (e + 1), 0]
                  [(i + j + 1), (e + j), 0]
                ]
              else
                [
                  [i, (e + 1), 0]
                  [(i + 1), (e + 1), 0]
                ]
            else
              if vector[h]
                [
                  [(i + 2), e, 0]
                ]
              else
                null
          else if h == w - 1
            if vector[h]
              [
                [(i + 1), e, 0]
              ]
            else
              [
                [i, (e + 1), 0]
                [(i + 1), (e + 1), 0]
              ]
          else # h == w
            [
              [i, (e + 1), 0]
            ]
        else
          if h <= w - 1 and t is 0
            if vector[h]
              [
                [(i + 1), n, 0]
              ]
            else
              null
          else if h <= w - 2 and t is 1 # [i,e] is a t-position
            if vector[h]
              [
                [(i + 2), n, 0]
              ]
            else
              null
          else # h == w
            null

    when MERGE_AND_SPLIT then (n) ->
      ([i,e,s], vector, offset) ->
        h = i - offset; w = vector.length
        if e == 0 < n
          if h <= w - 2
            if vector[h]
              [
                [(i + 1), e, 0]
              ]
            else
              [
                [i, (e + 1), 0]
                [i, (e + 1), 1] # s-position
                [(i + 1), (e + 1), 0]
                [(i + 2), (e + 1), 0]
              ]
          else if h == w - 1
            if vector[h]
              [
                [(i + 1), e, 0]
              ]
            else
              [
                [i, (e + 1), 0]
                [i, (e + 1), 1] # s-position
                [(i + 1), (e + 1), 0]
              ]
          else # h == w
            [
              [i, (e + 1), 0]
            ]
        else if e < n
          if h <= w - 2
            if s is 0
              if vector[h]
                [
                  [(i + 1), e, 0]
                ]
              else
                [
                  [i, (e + 1), 0]
                  [i, (e + 1), 1] # s-position
                  [(i + 1), (e + 1), 0]
                  [(i + 2), (e + 1), 0]
                ]
            else # [i,e] is an s-position
              [
                [(i + 1), e, 0]
              ]
          else if h == w - 1
            if s is 0
              if vector[h]
                [
                  [(i + 1), e, 0]
                ]
              else
                [
                  [i, (e + 1), 0]
                  [i, (e + 1), 1] # s-position
                  [(i + 1), (e + 1), 0]
                ]
            else # [i,e] is an s-position
              [
                [(i + 1), e, 0]
              ]
          else # h == w
            [
              [i, (e + 1), 0]
            ]
        else
          if h <= w - 1
            if s is 0
              if vector[h]
                [
                  [(i + 1), n, 0]
                ]
              else
                null
            else # [i,e] is an s-position
              [
                [(i + 1), e, 0]
              ]
          else # h == w
            null

  bisect_left =
    if algorithm is STANDARD
      (state, position) ->
        [i,e] = position; l = 0; u = state.length
        while l < u
          k = (l + u) >> 1
          p = state[k]
          if (e - p[1] || i - p[0]) > 0
            l = k + 1
          else
            u = k
        return l
    else
      (state, position) ->
        [i,e,x] = position; l = 0; u = state.length
        while l < u
          k = (l + u) >> 1
          p = state[k]
          if (e - p[1] || i - p[0] || x - p[2]) > 0
            l = k + 1
          else
            u = k
        return l

  copy =
    if algorithm is STANDARD
      (state) -> ([i,e] for [i,e] in state)
    else
      (state) -> ([i,e,x] for [i,e,x] in state)

  # NOTE: See my comment above bisect_error_right(state,e,l) and how I am
  # using it in unsubsume_for(n) for why I am not checking (e < f) below.
  subsumes = switch algorithm
    when STANDARD then (i,e, j,f) ->
      #(e < f) && Math.abs(j - i) <= (f - e)
      ((i < j) && (j - i) || (i - j)) <= (f - e)
    when TRANSPOSITION then (i,e,s, j,f,t, n) ->
      if s is 1
        if t is 1
          #(e < f) && (i == j)
          (i == j)
        else
          #(e < f == n) && (i == j)
          (f == n) && (i == j)
      else
        if t is 1
          #(e < f) && Math.abs(j - (i - 1)) <= (f - e)
          #
          # NOTE: This is how I derived what follows:
          #   Math.abs(j - (i - 1)) = Math.abs(j - i + 1) = Math.abs(j - i) + 1
          #
          ((i < j) && (j - i) || (i - j)) + 1 <= (f - e)
        else
          #(e < f) && Math.abs(j - i) <= (f - e)
          ((i < j) && (j - i) || (i - j)) <= (f - e)
    when MERGE_AND_SPLIT then(i,e,s, j,f,t) ->
      if s is 1 and t is 0
        false
      else
        #(e < f) && Math.abs(j - i) <= (f - e)
        ((i < j) && (j - i) || (i - j)) <= (f - e)

  # Given two positions [i,e] and [j,f], for [i,e] to subsume [j,f], it must
  # be the case that e < f.  Therefore, I can remove a redundant check for
  # (e < f) within the subsumes method by finding the first index that
  # contains a position having an error greater than the current one (assuming
  # that the positions are sorted in ascending order, according to error).
  bisect_error_right = (state, e, l) ->
    u = state.length
    while l < u
      i = (l + u) >> 1
      if e < state[i][1]
        u = i
      else
        l = i + 1
    return l

  unsubsume_for = switch algorithm
    when STANDARD then (n) ->
      (state) ->
        m = 0
        while x = state[m]
          # TODO: Experiment with whether it is faster to perform a linear scan
          # rather than invoking a method call, to find the value for `n`.
          [i,e] = x; n = bisect_error_right(state, e, m)
          while y = state[n]
            [j,f] = y
            if subsumes(i,e, j,f)
              state.splice(n,1)
            else
              n += 1
          m += 1
        return
    when TRANSPOSITION then (n) ->
      (state) ->
        m = 0
        while x = state[m]
          [i,e,s] = x; n = bisect_error_right(state, e, m)
          while y = state[n]
            [j,f,t] = y
            if subsumes(i,e,s, j,f,t, n)
              state.splice(n,1)
            else
              n += 1
          m += 1
        return
    when MERGE_AND_SPLIT then (n) ->
      (state) ->
        m = 0
        while x = state[m]
          [i,e,s] = x; n = bisect_error_right(state, e, m)
          while y = state[n]
            [j,f,t] = y
            if subsumes(i,e,s, j,f,t, n)
              state.splice(n,1)
            else
              n += 1
          m += 1
        return

  stringify_state =
    if algorithm is STANDARD
      (state) ->
        signature = ''
        for [i,e] in state
          signature += i.toString() + ',' + e.toString()
        signature
    else
      (state) ->
        signature = ''
        for [i,e,x] in state
          signature += i.toString() + ',' + e.toString() + ',' + x.toString()
        signature

  insert_for_subsumption =
    if algorithm is STANDARD
      (state_prime, next_state) ->
        # Order according to error first, then boundary (both ascending).
        # While sorting the elements, remove any duplicates.
        for position in next_state
          i = bisect_left(state_prime, position)
          if curr = state_prime[i]
            if curr[0] != position[0] || curr[1] != position[1]
              state_prime.splice(i, 0, position)
          else
            state_prime.push(position)
        return
    else
      (state_prime, next_state) ->
        # Order according to error first, then boundary (both ascending).
        # While sorting the elements, remove any duplicates.
        for position in next_state
          i = bisect_left(state_prime, position)
          if curr = state_prime[i]
            if curr[0] != position[0] || curr[1] != position[1] || curr[2] != position[2]
              state_prime.splice(i, 0, position)
          else
            state_prime.push(position)
        return

  sort_for_transition =
    if algorithm is STANDARD
      (state) ->
        state.sort (a,b) -> a[0] - b[0] || a[1] - b[1]
        return
    else
      (state) ->
        state.sort (a,b) -> a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
        return

  transition_for_state = (n) ->
    transition = transition_for_position(n)
    unsubsume = unsubsume_for(n)

    (state, vector) ->
      offset = state[0][0]; state_prime = []

      for position in state
        next_state = transition(position, vector, offset)
        continue unless next_state isnt null
        insert_for_subsumption(state_prime, next_state)
      unsubsume(state_prime)

      if state_prime.length > 0
        sort_for_transition(state_prime)
        state_prime
      else
        null

  if dictionary instanceof Dawg
    dawg = dictionary
  else if dictionary instanceof Array
    dictionary.sort() unless sorted
    dawg = new Dawg(dictionary)
  else
    throw new Error("Unsupported dictionary type: #{typeof dictionary}")

  characteristic_vector = (x, term, k, i) ->
    vector = []; j = 0
    while j < k
      vector.push(x is term[i + j])
      j += 1
    vector

  is_final =
    if algorithm is STANDARD
      (state, w, n) ->
        for [i,e] in state
          return true if (w - i) <= (n - e)
        return false
    else
      (state, w, n) ->
        for [i,e,x] in state
          return true if x isnt 1 and (w - i) <= (n - e)
        return false

  # The distance of each position in a state can be defined as follows, where w
  # is the length of the query term, i is the boundary of the current position,
  # and e is the current position's error:
  #
  #   distance = w - i + e
  #
  # It is characteristic of the generated states that i <= w.  Therefore, w - i
  # provides the number of characters remaining to be inserted before the two
  # terms are of equal lengths.  Because each insertion has a weight of 1, the
  # number of characters remaining increases the position's current error by the
  # same number (of characters remaining).  This is the intuition behind how I
  # derived the cumulative error of the position of interest.
  #
  # For every accepting position, it must be the case that w - i <= n - e, where
  # n is the maximum allowed edit distance.  It follows directly that the
  # distance of every accepted position must be no more than n:
  #
  # (w - i <= n - e) <=> (w - i + e <= n) <=> (distance <= n)
  #
  # The Levenshtein distance between any two terms is defined as the minimum
  # edit distance between them.  Therefore, iterate over each position in an
  # accepting state, and take the minimum distance among all its accepting
  # positions as the corresponding Levenshtein distance.  This is the intuition
  # behind how I derieved the minimum distance of the state of interest.
  minimum_distance =
    if algorithm is STANDARD
      (state, w) ->
        minimum = Infinity
        for [i,e] in state
          d = w - i + e
          minimum = d if d < minimum
        minimum
    else
      (state, w) ->
        minimum = Infinity
        for [i,e,x] in state
          d = w - i + e
          minimum = d if x isnt 1 and d < minimum
        minimum

  insert_match =
    if sort_accepted
      if include_distance
        if case_insensitive
          (accepted, term, distance) ->
            l = 0; u = accepted.length; downcased = term.toLowerCase()
            while l < u
              i = (l + u) >> 1; [w,d] = accepted[i]
              if (d - distance || w.toLowerCase().localeCompare(downcased)) < 0
                l = i + 1
              else
                u = i
            accepted.splice(l, 0, [term, distance])
        else
          (accepted, term, distance) ->
            l = 0; u = accepted.length
            while l < u
              i = (l + u) >> 1; [w,d] = accepted[i]
              if (d - distance || w.localeCompare(term)) < 0
                l = i + 1
              else
                u = i
            accepted.splice(l, 0, [term, distance])
      else
        if case_insensitive
          (accepted, term) ->
            l = 0; u = accepted.length; downcased = term.toLowerCase()
            while l < u
              i = (l + u) >> 1; [w,d] = accepted[i]
              if w.toLowerCase().localeCompare(downcased) < 0
                l = i + 1
              else
                u = i
            accepted.splice(l, 0, term)
        else
          (accepted, term) ->
            l = 0; u = accepted.length
            while l < u
              i = (l + u) >> 1; [w,d] = accepted[i]
              if w.localeCompare(term) < 0
                l = i + 1
              else
                u = i
            accepted.splice(l, 0, term)
    else
      if include_distance
        (accepted, term, distance) -> accepted.push([term, distance])
      else
        (accepted, term) -> accepted.push(term)

  initial_state =
    if algorithm is STANDARD
      [[0,0]]
    else
      [[0,0,0]]

  profile = (term, k, i) ->
    vectors = {'': []}; j = 0
    while j < k
      c = term[i + j]
      unless vectors[c]
        vector = []; l = 0
        while l < j
          vector.push(false)
          l += 1
        vectors[c] = vector
      for d, vector of vectors
        vector.push(c is d)
      j += 1
    vectors

  if include_distance
    (term, n) ->
      w = term.length
      transition = transition_for_state(n)
      accepted = []; stack = [['', dawg['root'], initial_state]]
      while stack.length > 0
        [V, q_D, M] = stack.pop(); i = M[0][0]
        a = 2 * n + 1; b = w - i
        k = if a < b then a else b
        for x, next_q_D of q_D['edges']
          vector = characteristic_vector(x, term, k, i)
          next_M = transition(M, vector)
          if next_M
            next_V = V + x
            stack.push([next_V, next_q_D, next_M])
            if next_q_D['is_final'] and (d = minimum_distance(next_M, w)) <= n
              insert_match(accepted, next_V, d)
      accepted
  else
    (term, n) ->
      w = term.length
      transition = transition_for_state(n)
      accepted = []; stack = [['', dawg['root'], initial_state]]
      while stack.length > 0
        [V, q_D, M] = stack.pop(); i = M[0][0]
        a = 2 * n + 1; b = w - i
        k = if a < b then a else b
        for x, next_q_D of q_D['edges']
          vector = characteristic_vector(x, term, k, i)
          next_M = transition(M, vector)
          if next_M
            next_V = V + x
            stack.push([next_V, next_q_D, next_M])
            if next_q_D['is_final'] and is_final(next_M, w, n)
              insert_match(accepted, next_V)
      accepted

levenshtein['transducer'] = transducer

