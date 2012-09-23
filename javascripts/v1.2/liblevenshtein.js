/**
@license
Copyright (c) 2012 Dylon Edwards

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


(function() {
  'use strict';

  var DAWG, Dawg, DawgNode, LIST, MERGE_AND_SPLIT, STANDARD, TRANSPOSITION, distance, levenshtein, transducer;

  STANDARD = 'standard';

  TRANSPOSITION = 'transposition';

  MERGE_AND_SPLIT = 'merge_and_split';

  levenshtein = {};

  if (typeof window !== 'undefined') {
    window['levenshtein'] = levenshtein;
  } else {
    exports['levenshtein'] = levenshtein;
  }

  distance = function(algorithm) {
    var f;
    if (algorithm !== STANDARD && algorithm !== TRANSPOSITION && algorithm !== MERGE_AND_SPLIT) {
      algorithm = STANDARD;
    }
    f = function(u, t) {
      if (t < u.length) {
        return u.slice(t + 1);
      } else {
        return '';
      }
    };
    switch (algorithm) {
      case STANDARD:
        return (function() {
          var memoized_distance;
          memoized_distance = {};
          return distance = function(v, w) {
            var a, b, key, min, p, s, t, value;
            key = v + '|' + w;
            if ((value = memoized_distance[key]) !== undefined) {
              return value;
            } else {
              if (v === '') {
                return memoized_distance[key] = w.length;
              } else if (w === '') {
                return memoized_distance[key] = v.length;
              } else {
                a = v[0];
                s = v.slice(1);
                b = w[0];
                t = w.slice(1);
                while (a === b && s.length > 0 && t.length > 0) {
                  a = s[0];
                  v = s;
                  s = s.slice(1);
                  b = t[0];
                  w = t;
                  t = t.slice(1);
                }
                if (a === b) {
                  return memoized_distance[key] = s.length || t.length;
                }
                if ((p = distance(s, w)) === 0) {
                  return memoized_distance[key] = 1;
                }
                min = p;
                if ((p = distance(v, t)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                if ((p = distance(s, t)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                return memoized_distance[key] = 1 + min;
              }
            }
          };
        })();
      case TRANSPOSITION:
        return (function() {
          var memoized_distance;
          memoized_distance = {};
          return distance = function(v, w) {
            var a, a1, b, b1, key, min, p, value, x, y;
            key = v + '|' + w;
            if ((value = memoized_distance[key]) !== undefined) {
              return value;
            } else {
              if (v === '') {
                return memoized_distance[key] = w.length;
              } else if (w === '') {
                return memoized_distance[key] = v.length;
              } else {
                a = v[0];
                x = v.slice(1);
                b = w[0];
                y = w.slice(1);
                while (a === b && x.length > 0 && y.length > 0) {
                  a = x[0];
                  v = x;
                  x = x.slice(1);
                  b = y[0];
                  w = y;
                  y = y.slice(1);
                }
                if (a === b) {
                  return memoized_distance[key] = x.length || y.length;
                }
                if ((p = distance(x, w)) === 0) {
                  return memoized_distance[key] = 1;
                }
                min = p;
                if ((p = distance(v, y)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                if ((p = distance(x, y)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                a1 = x[0];
                b1 = y[0];
                if (a === b1 && a1 === b) {
                  if ((p = distance(f(v, 1), f(w, 1))) === 0) {
                    return memoized_distance[key] = 1;
                  }
                  if (p < min) {
                    min = p;
                  }
                }
                return memoized_distance[key] = 1 + min;
              }
            }
          };
        })();
      case MERGE_AND_SPLIT:
        return (function() {
          var memoized_distance;
          memoized_distance = {};
          return distance = function(v, w) {
            var a, b, key, min, p, value, x, y;
            key = v + '|' + w;
            if ((value = memoized_distance[key]) !== undefined) {
              return value;
            } else {
              if (v === '') {
                return memoized_distance[key] = w.length;
              } else if (w === '') {
                return memoized_distance[key] = v.length;
              } else {
                a = v[0];
                x = v.slice(1);
                b = w[0];
                y = w.slice(1);
                while (a === b && x.length > 0 && y.length > 0) {
                  a = x[0];
                  v = x;
                  x = x.slice(1);
                  b = y[0];
                  w = y;
                  y = y.slice(1);
                }
                if (a === b) {
                  return memoized_distance[key] = x.length || y.length;
                }
                if ((p = distance(x, w)) === 0) {
                  return memoized_distance[key] = 1;
                }
                min = p;
                if ((p = distance(v, y)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                if ((p = distance(x, y)) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                if ((p = w.length > 1 ? distance(x, f(w, 1)) : Infinity) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                if ((p = v.length > 1 ? distance(f(v, 1), y) : Infinity) === 0) {
                  return memoized_distance[key] = 1;
                }
                if (p < min) {
                  min = p;
                }
                return memoized_distance[key] = 1 + min;
              }
            }
          };
        })();
    }
  };

  levenshtein['distance'] = distance;

  DawgNode = (function() {

    DawgNode.next_id = 0;

    function DawgNode() {
      this.id = DawgNode.next_id;
      DawgNode.next_id += 1;
      this['is_final'] = false;
      this['edges'] = {};
    }

    DawgNode.prototype.bisect_left = function(edges, edge, lower, upper) {
      var i;
      while (lower < upper) {
        i = (lower + upper) >> 1;
        if (edges[i] < edge) {
          lower = i + 1;
        } else {
          upper = i;
        }
      }
      return lower;
    };

    DawgNode.prototype['toString'] = function() {
      var edge, edges, label, node, _ref;
      edges = [];
      _ref = this['edges'];
      for (label in _ref) {
        node = _ref[label];
        edge = label + node.id.toString();
        edges.splice(this.bisect_left(edges, edge, 0, edges.length), 0, edge);
      }
      return (this['is_final'] ? '1' : '0') + edges.join('');
    };

    return DawgNode;

  })();

  Dawg = (function() {

    function Dawg(dictionary) {
      var word, _i, _len;
      this.previous_word = '';
      this['root'] = new DawgNode();
      this.unchecked_nodes = [];
      this.minimized_nodes = {};
      for (_i = 0, _len = dictionary.length; _i < _len; _i++) {
        word = dictionary[_i];
        this['insert'](word);
      }
      this['finish']();
    }

    Dawg.prototype['insert'] = function(word) {
      var character, i, next_node, node, previous_word, unchecked_nodes, upper_bound;
      i = 0;
      previous_word = this.previous_word;
      upper_bound = word.length < previous_word.length ? word.length : previous_word.length;
      while (i < upper_bound && word[i] === previous_word[i]) {
        i += 1;
      }
      this['minimize'](i);
      unchecked_nodes = this.unchecked_nodes;
      if (unchecked_nodes.length === 0) {
        node = this['root'];
      } else {
        node = unchecked_nodes[unchecked_nodes.length - 1][2];
      }
      while (character = word[i]) {
        next_node = new DawgNode();
        node['edges'][character] = next_node;
        unchecked_nodes.push([node, character, next_node]);
        node = next_node;
        i += 1;
      }
      node['is_final'] = true;
      this.previous_word = word;
    };

    Dawg.prototype['finish'] = function() {
      this['minimize'](0);
    };

    Dawg.prototype['minimize'] = function(lower_bound) {
      var character, child, child_key, j, minimized_nodes, parent, unchecked_nodes, _ref;
      minimized_nodes = this.minimized_nodes;
      unchecked_nodes = this.unchecked_nodes;
      j = unchecked_nodes.length;
      while (j > lower_bound) {
        _ref = unchecked_nodes.pop(), parent = _ref[0], character = _ref[1], child = _ref[2];
        child_key = child.toString();
        if (child_key in minimized_nodes) {
          parent['edges'][character] = minimized_nodes[child_key];
        } else {
          minimized_nodes[child_key] = child;
        }
        j -= 1;
      }
    };

    Dawg.prototype['accepts'] = function(word) {
      var edge, node, _i, _len;
      node = this['root'];
      for (_i = 0, _len = word.length; _i < _len; _i++) {
        edge = word[_i];
        node = node['edges'][edge];
        if (!node) {
          return false;
        }
      }
      return node['is_final'];
    };

    return Dawg;

  })();

  levenshtein['DawgNode'] = DawgNode;

  levenshtein['Dawg'] = Dawg;

  LIST = 'list';

  DAWG = 'dawg';

  /**
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
  */


  transducer = function(args) {
    /**
    Dictionary of words available to the transducer. These are what will be
    evaluated and returned, and may be specified as either an Array.<string> or a
    Dawg. If an Array.<string> is used as the dictionary, it will be converted to
    a Dawg; if the Array.<string> is not sorted, it will be sorted before being
    converted to a Dawg.
    
    @type {!(Array.<string>|Dawg)}
    */

    var algorithm, bisect_error_right, bisect_left, case_insensitive, characteristic_vector, copy, dawg, dictionary, include_distance, index_of, initial_state, insert_for_subsumption, insert_match, is_final, minimum_distance, profile, sort_accepted, sort_for_transition, sorted, stringify_state, subsumes, transition_for_position, transition_for_state, unsubsume_for;
    dictionary = args['dictionary'];
    /**
    Specifies whether the dictionary is sorted. This is only useful when the
    dictionary is of type Array.<string>, and is ignored when it is of type Dawg.
    
    @type {?boolean}
    */

    sorted = args['sorted'];
    /**
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
    */

    algorithm = args['algorithm'];
    /**
    Whether to sort the terms accepted by the transducer. If left unspecified,
    this defaults to `true`.
    
    @type {?boolean}
    */

    sort_accepted = args['sort_accepted'];
    /**
    Whether to include the distance metrics with the accepted terms. If left
    unspecified, this defaults to `true`.
    
    @type {?boolean}
    */

    include_distance = args['include_distance'];
    /**
    Whether to sort the accepted terms in a case-insensitive manner. If left
    unspecified, this defaults to `true`.
    
    @type {?boolean}
    */

    case_insensitive = args['case_insensitive'];
    if (!dictionary) {
      throw new Error('No dictionary was specified');
    }
    if (!(dictionary instanceof Array || dictionary instanceof Dawg)) {
      throw new Error('dictionary must be either an Array or levenshtein.Dawg');
    }
    if ((sorted != null) && typeof sorted !== 'boolean') {
      throw new Error("expected 'sorted' to be of type 'boolean', received '" + (typeof sorted) + "'");
    }
    if ((algorithm != null) && (typeof algorithm !== 'string' || (algorithm !== STANDARD && algorithm !== TRANSPOSITION && algorithm !== MERGE_AND_SPLIT))) {
      throw new Error("unsupported value of 'algorithm': '" + algorithm + "'");
    }
    if ((sort_accepted != null) && typeof sort_accepted !== 'boolean') {
      throw new Error("expected 'sort_accepted' to be of type 'boolean', received '" + (typeof sort_accepted) + "'");
    }
    if ((include_distance != null) && typeof include_distance !== 'boolean') {
      throw new Error("expected 'include_distance' to be of type 'boolean', received '" + (typeof include_distance) + "'");
    }
    if ((case_insensitive != null) && typeof case_insensitive !== 'boolean') {
      throw new Error("expected 'case_insensitive' to be of type 'boolean', received '" + (typeof case_insensitive) + "'");
    }
    if (sorted == null) {
      sorted = false;
    }
    if (algorithm == null) {
      algorithm = STANDARD;
    }
    if (sort_accepted == null) {
      sort_accepted = true;
    }
    if (include_distance == null) {
      include_distance = true;
    }
    if (case_insensitive == null) {
      case_insensitive = true;
    }
    /**
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
    */

    index_of = function(vector, k, i) {
      var j;
      j = 0;
      while (j < k) {
        if (vector[i + j]) {
          return j;
        }
        j += 1;
      }
      return -1;
    };
    /**
    Returns a position transition function, which maps positions into states
    according to the specified algorithm.
    
    @param {number} n Maximum allowed edit distance.
    @return {function(Array.<number>, Array.<boolean>, number) : Array.<Array,<number>>}
      The position transition function corresponding to the specified algorithm.
      The first parameter corresponds to the current position, the second
      corresponds to a characteristic vector at the minimal boundary of the
      current state, and the third is the offset with which to relabel the
      boundary of the current position.
    */

    transition_for_position = (function() {
      switch (algorithm) {
        case STANDARD:
          return function(n) {
            return function(_arg, vector, offset) {
              var a, b, e, h, i, j, k, w;
              i = _arg[0], e = _arg[1];
              h = i - offset;
              w = vector.length;
              if (e < n) {
                if (h <= w - 2) {
                  a = n - e + 1;
                  b = w - h;
                  k = a < b ? a : b;
                  j = index_of(vector, k, h);
                  if (j === 0) {
                    return [[i + 1, e]];
                  } else if (j > 0) {
                    return [[i, e + 1], [i + 1, e + 1], [i + j + 1, e + j]];
                  } else {
                    return [[i, e + 1], [i + 1, e + 1]];
                  }
                } else if (h === w - 1) {
                  if (vector[h]) {
                    return [[i + 1, e]];
                  } else {
                    return [[i, e + 1], [i + 1, e + 1]];
                  }
                } else {
                  return [[i, e + 1]];
                }
              } else if (e === n) {
                if (h <= w - 1) {
                  if (vector[h]) {
                    return [[i + 1, n]];
                  } else {
                    return null;
                  }
                } else {
                  return null;
                }
              } else {
                return null;
              }
            };
          };
        case TRANSPOSITION:
          return function(n) {
            return function(_arg, vector, offset) {
              var a, b, e, h, i, j, k, t, w;
              i = _arg[0], e = _arg[1], t = _arg[2];
              h = i - offset;
              w = vector.length;
              if ((e === 0 && 0 < n)) {
                if (h <= w - 2) {
                  a = n - e + 1;
                  b = w - h;
                  k = a < b ? a : b;
                  j = index_of(vector, k, h);
                  if (j === 0) {
                    return [[i + 1, 0, 0]];
                  } else if (j === 1) {
                    return [[i, 1, 0], [i, 1, 1], [i + 1, 1, 0], [i + 2, 1, 0]];
                  } else if (j > 1) {
                    return [[i, 1, 0], [i + 1, 1, 0], [i + j + 1, j, 0]];
                  } else {
                    return [[i, 1, 0], [i + 1, 1, 0]];
                  }
                } else if (h === w - 1) {
                  if (vector[h]) {
                    return [[i + 1, 0, 0]];
                  } else {
                    return [[i, 1, 0], [i + 1, 1, 0]];
                  }
                } else {
                  return [[i, 1, 0]];
                }
              } else if ((1 <= e && e < n)) {
                if (h <= w - 2) {
                  if (t === 0) {
                    a = n - e + 1;
                    b = w - h;
                    k = a < b ? a : b;
                    j = index_of(vector, k, h);
                    if (j === 0) {
                      return [[i + 1, e, 0]];
                    } else if (j === 1) {
                      return [[i, e + 1, 0], [i, e + 1, 1], [i + 1, e + 1, 0], [i + 2, e + 1, 0]];
                    } else if (j > 1) {
                      return [[i, e + 1, 0], [i + 1, e + 1, 0], [i + j + 1, e + j, 0]];
                    } else {
                      return [[i, e + 1, 0], [i + 1, e + 1, 0]];
                    }
                  } else {
                    if (vector[h]) {
                      return [[i + 2, e, 0]];
                    } else {
                      return null;
                    }
                  }
                } else if (h === w - 1) {
                  if (vector[h]) {
                    return [[i + 1, e, 0]];
                  } else {
                    return [[i, e + 1, 0], [i + 1, e + 1, 0]];
                  }
                } else {
                  return [[i, e + 1, 0]];
                }
              } else {
                if (h <= w - 1 && t === 0) {
                  if (vector[h]) {
                    return [[i + 1, n, 0]];
                  } else {
                    return null;
                  }
                } else if (h <= w - 2 && t === 1) {
                  if (vector[h]) {
                    return [[i + 2, n, 0]];
                  } else {
                    return null;
                  }
                } else {
                  return null;
                }
              }
            };
          };
        case MERGE_AND_SPLIT:
          return function(n) {
            return function(_arg, vector, offset) {
              var e, h, i, s, w;
              i = _arg[0], e = _arg[1], s = _arg[2];
              h = i - offset;
              w = vector.length;
              if ((e === 0 && 0 < n)) {
                if (h <= w - 2) {
                  if (vector[h]) {
                    return [[i + 1, e, 0]];
                  } else {
                    return [[i, e + 1, 0], [i, e + 1, 1], [i + 1, e + 1, 0], [i + 2, e + 1, 0]];
                  }
                } else if (h === w - 1) {
                  if (vector[h]) {
                    return [[i + 1, e, 0]];
                  } else {
                    return [[i, e + 1, 0], [i, e + 1, 1], [i + 1, e + 1, 0]];
                  }
                } else {
                  return [[i, e + 1, 0]];
                }
              } else if (e < n) {
                if (h <= w - 2) {
                  if (s === 0) {
                    if (vector[h]) {
                      return [[i + 1, e, 0]];
                    } else {
                      return [[i, e + 1, 0], [i, e + 1, 1], [i + 1, e + 1, 0], [i + 2, e + 1, 0]];
                    }
                  } else {
                    return [[i + 1, e, 0]];
                  }
                } else if (h === w - 1) {
                  if (s === 0) {
                    if (vector[h]) {
                      return [[i + 1, e, 0]];
                    } else {
                      return [[i, e + 1, 0], [i, e + 1, 1], [i + 1, e + 1, 0]];
                    }
                  } else {
                    return [[i + 1, e, 0]];
                  }
                } else {
                  return [[i, e + 1, 0]];
                }
              } else {
                if (h <= w - 1) {
                  if (s === 0) {
                    if (vector[h]) {
                      return [[i + 1, n, 0]];
                    } else {
                      return null;
                    }
                  } else {
                    return [[i + 1, e, 0]];
                  }
                } else {
                  return null;
                }
              }
            };
          };
      }
    })();
    bisect_left = algorithm === STANDARD ? function(state, position) {
      var e, i, k, l, p, u;
      i = position[0], e = position[1];
      l = 0;
      u = state.length;
      while (l < u) {
        k = (l + u) >> 1;
        p = state[k];
        if ((e - p[1] || i - p[0]) > 0) {
          l = k + 1;
        } else {
          u = k;
        }
      }
      return l;
    } : function(state, position) {
      var e, i, k, l, p, u, x;
      i = position[0], e = position[1], x = position[2];
      l = 0;
      u = state.length;
      while (l < u) {
        k = (l + u) >> 1;
        p = state[k];
        if ((e - p[1] || i - p[0] || x - p[2]) > 0) {
          l = k + 1;
        } else {
          u = k;
        }
      }
      return l;
    };
    copy = algorithm === STANDARD ? function(state) {
      var e, i, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1];
        _results.push([i, e]);
      }
      return _results;
    } : function(state) {
      var e, i, x, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1], x = _ref[2];
        _results.push([i, e, x]);
      }
      return _results;
    };
    subsumes = (function() {
      switch (algorithm) {
        case STANDARD:
          return function(i, e, j, f) {
            return ((i < j) && (j - i) || (i - j)) <= (f - e);
          };
        case TRANSPOSITION:
          return function(i, e, s, j, f, t, n) {
            if (s === 1) {
              if (t === 1) {
                return i === j;
              } else {
                return (f === n) && (i === j);
              }
            } else {
              if (t === 1) {
                return ((i < j) && (j - i) || (i - j)) + 1 <= (f - e);
              } else {
                return ((i < j) && (j - i) || (i - j)) <= (f - e);
              }
            }
          };
        case MERGE_AND_SPLIT:
          return function(i, e, s, j, f, t) {
            if (s === 1 && t === 0) {
              return false;
            } else {
              return ((i < j) && (j - i) || (i - j)) <= (f - e);
            }
          };
      }
    })();
    bisect_error_right = function(state, e, l) {
      var i, u;
      u = state.length;
      while (l < u) {
        i = (l + u) >> 1;
        if (e < state[i][1]) {
          u = i;
        } else {
          l = i + 1;
        }
      }
      return l;
    };
    unsubsume_for = (function() {
      switch (algorithm) {
        case STANDARD:
          return function(n) {
            return function(state) {
              var e, f, i, j, m, x, y;
              m = 0;
              while (x = state[m]) {
                i = x[0], e = x[1];
                n = bisect_error_right(state, e, m);
                while (y = state[n]) {
                  j = y[0], f = y[1];
                  if (subsumes(i, e, j, f)) {
                    state.splice(n, 1);
                  } else {
                    n += 1;
                  }
                }
                m += 1;
              }
            };
          };
        case TRANSPOSITION:
          return function(n) {
            return function(state) {
              var e, f, i, j, m, s, t, x, y;
              m = 0;
              while (x = state[m]) {
                i = x[0], e = x[1], s = x[2];
                n = bisect_error_right(state, e, m);
                while (y = state[n]) {
                  j = y[0], f = y[1], t = y[2];
                  if (subsumes(i, e, s, j, f, t, n)) {
                    state.splice(n, 1);
                  } else {
                    n += 1;
                  }
                }
                m += 1;
              }
            };
          };
        case MERGE_AND_SPLIT:
          return function(n) {
            return function(state) {
              var e, f, i, j, m, s, t, x, y;
              m = 0;
              while (x = state[m]) {
                i = x[0], e = x[1], s = x[2];
                n = bisect_error_right(state, e, m);
                while (y = state[n]) {
                  j = y[0], f = y[1], t = y[2];
                  if (subsumes(i, e, s, j, f, t, n)) {
                    state.splice(n, 1);
                  } else {
                    n += 1;
                  }
                }
                m += 1;
              }
            };
          };
      }
    })();
    stringify_state = algorithm === STANDARD ? function(state) {
      var e, i, signature, _i, _len, _ref;
      signature = '';
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1];
        signature += i.toString() + ',' + e.toString();
      }
      return signature;
    } : function(state) {
      var e, i, signature, x, _i, _len, _ref;
      signature = '';
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1], x = _ref[2];
        signature += i.toString() + ',' + e.toString() + ',' + x.toString();
      }
      return signature;
    };
    insert_for_subsumption = algorithm === STANDARD ? function(state_prime, next_state) {
      var curr, i, position, _i, _len;
      for (_i = 0, _len = next_state.length; _i < _len; _i++) {
        position = next_state[_i];
        i = bisect_left(state_prime, position);
        if (curr = state_prime[i]) {
          if (curr[0] !== position[0] || curr[1] !== position[1]) {
            state_prime.splice(i, 0, position);
          }
        } else {
          state_prime.push(position);
        }
      }
    } : function(state_prime, next_state) {
      var curr, i, position, _i, _len;
      for (_i = 0, _len = next_state.length; _i < _len; _i++) {
        position = next_state[_i];
        i = bisect_left(state_prime, position);
        if (curr = state_prime[i]) {
          if (curr[0] !== position[0] || curr[1] !== position[1] || curr[2] !== position[2]) {
            state_prime.splice(i, 0, position);
          }
        } else {
          state_prime.push(position);
        }
      }
    };
    sort_for_transition = algorithm === STANDARD ? function(state) {
      state.sort(function(a, b) {
        return a[0] - b[0] || a[1] - b[1];
      });
    } : function(state) {
      state.sort(function(a, b) {
        return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
      });
    };
    transition_for_state = function(n) {
      var transition, unsubsume;
      transition = transition_for_position(n);
      unsubsume = unsubsume_for(n);
      return function(state, vector) {
        var next_state, offset, position, state_prime, _i, _len;
        offset = state[0][0];
        state_prime = [];
        for (_i = 0, _len = state.length; _i < _len; _i++) {
          position = state[_i];
          next_state = transition(position, vector, offset);
          if (next_state === null) {
            continue;
          }
          insert_for_subsumption(state_prime, next_state);
        }
        unsubsume(state_prime);
        if (state_prime.length > 0) {
          sort_for_transition(state_prime);
          return state_prime;
        } else {
          return null;
        }
      };
    };
    if (dictionary instanceof Dawg) {
      dawg = dictionary;
    } else if (dictionary instanceof Array) {
      if (!sorted) {
        dictionary.sort();
      }
      dawg = new Dawg(dictionary);
    } else {
      throw new Error("Unsupported dictionary type: " + (typeof dictionary));
    }
    characteristic_vector = function(x, term, k, i) {
      var j, vector;
      vector = [];
      j = 0;
      while (j < k) {
        vector.push(x === term[i + j]);
        j += 1;
      }
      return vector;
    };
    is_final = algorithm === STANDARD ? function(state, w, n) {
      var e, i, _i, _len, _ref;
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1];
        if ((w - i) <= (n - e)) {
          return true;
        }
      }
      return false;
    } : function(state, w, n) {
      var e, i, x, _i, _len, _ref;
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1], x = _ref[2];
        if (x !== 1 && (w - i) <= (n - e)) {
          return true;
        }
      }
      return false;
    };
    minimum_distance = algorithm === STANDARD ? function(state, w) {
      var d, e, i, minimum, _i, _len, _ref;
      minimum = Infinity;
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1];
        d = w - i + e;
        if (d < minimum) {
          minimum = d;
        }
      }
      return minimum;
    } : function(state, w) {
      var d, e, i, minimum, x, _i, _len, _ref;
      minimum = Infinity;
      for (_i = 0, _len = state.length; _i < _len; _i++) {
        _ref = state[_i], i = _ref[0], e = _ref[1], x = _ref[2];
        d = w - i + e;
        if (x !== 1 && d < minimum) {
          minimum = d;
        }
      }
      return minimum;
    };
    insert_match = sort_accepted ? include_distance ? case_insensitive ? function(accepted, term, distance) {
      var d, downcased, i, l, u, w, _ref;
      l = 0;
      u = accepted.length;
      downcased = term.toLowerCase();
      while (l < u) {
        i = (l + u) >> 1;
        _ref = accepted[i], w = _ref[0], d = _ref[1];
        if ((d - distance || w.toLowerCase().localeCompare(downcased)) < 0) {
          l = i + 1;
        } else {
          u = i;
        }
      }
      return accepted.splice(l, 0, [term, distance]);
    } : function(accepted, term, distance) {
      var d, i, l, u, w, _ref;
      l = 0;
      u = accepted.length;
      while (l < u) {
        i = (l + u) >> 1;
        _ref = accepted[i], w = _ref[0], d = _ref[1];
        if ((d - distance || w.localeCompare(term)) < 0) {
          l = i + 1;
        } else {
          u = i;
        }
      }
      return accepted.splice(l, 0, [term, distance]);
    } : case_insensitive ? function(accepted, term) {
      var d, downcased, i, l, u, w, _ref;
      l = 0;
      u = accepted.length;
      downcased = term.toLowerCase();
      while (l < u) {
        i = (l + u) >> 1;
        _ref = accepted[i], w = _ref[0], d = _ref[1];
        if (w.toLowerCase().localeCompare(downcased) < 0) {
          l = i + 1;
        } else {
          u = i;
        }
      }
      return accepted.splice(l, 0, term);
    } : function(accepted, term) {
      var d, i, l, u, w, _ref;
      l = 0;
      u = accepted.length;
      while (l < u) {
        i = (l + u) >> 1;
        _ref = accepted[i], w = _ref[0], d = _ref[1];
        if (w.localeCompare(term) < 0) {
          l = i + 1;
        } else {
          u = i;
        }
      }
      return accepted.splice(l, 0, term);
    } : include_distance ? function(accepted, term, distance) {
      return accepted.push([term, distance]);
    } : function(accepted, term) {
      return accepted.push(term);
    };
    initial_state = algorithm === STANDARD ? [[0, 0]] : [[0, 0, 0]];
    profile = function(term, k, i) {
      var c, d, j, l, vector, vectors;
      vectors = {
        '': []
      };
      j = 0;
      while (j < k) {
        c = term[i + j];
        if (!vectors[c]) {
          vector = [];
          l = 0;
          while (l < j) {
            vector.push(false);
            l += 1;
          }
          vectors[c] = vector;
        }
        for (d in vectors) {
          vector = vectors[d];
          vector.push(c === d);
        }
        j += 1;
      }
      return vectors;
    };
    if (include_distance) {
      return function(term, n) {
        var M, V, a, accepted, b, d, i, k, next_M, next_V, next_q_D, q_D, stack, transition, vector, w, x, _ref, _ref1;
        w = term.length;
        transition = transition_for_state(n);
        accepted = [];
        stack = [['', dawg['root'], initial_state]];
        while (stack.length > 0) {
          _ref = stack.pop(), V = _ref[0], q_D = _ref[1], M = _ref[2];
          i = M[0][0];
          a = 2 * n + 1;
          b = w - i;
          k = a < b ? a : b;
          _ref1 = q_D['edges'];
          for (x in _ref1) {
            next_q_D = _ref1[x];
            vector = characteristic_vector(x, term, k, i);
            next_M = transition(M, vector);
            if (next_M) {
              next_V = V + x;
              stack.push([next_V, next_q_D, next_M]);
              if (next_q_D['is_final'] && (d = minimum_distance(next_M, w)) <= n) {
                insert_match(accepted, next_V, d);
              }
            }
          }
        }
        return accepted;
      };
    } else {
      return function(term, n) {
        var M, V, a, accepted, b, i, k, next_M, next_V, next_q_D, q_D, stack, transition, vector, w, x, _ref, _ref1;
        w = term.length;
        transition = transition_for_state(n);
        accepted = [];
        stack = [['', dawg['root'], initial_state]];
        while (stack.length > 0) {
          _ref = stack.pop(), V = _ref[0], q_D = _ref[1], M = _ref[2];
          i = M[0][0];
          a = 2 * n + 1;
          b = w - i;
          k = a < b ? a : b;
          _ref1 = q_D['edges'];
          for (x in _ref1) {
            next_q_D = _ref1[x];
            vector = characteristic_vector(x, term, k, i);
            next_M = transition(M, vector);
            if (next_M) {
              next_V = V + x;
              stack.push([next_V, next_q_D, next_M]);
              if (next_q_D['is_final'] && is_final(next_M, w, n)) {
                insert_match(accepted, next_V);
              }
            }
          }
        }
        return accepted;
      };
    }
  };

  levenshtein['transducer'] = transducer;

}).call(this);
