# Levshtein Automata

### Basic Usage:

Add the following `<script>` tag to the `<head>` section of your document:

```html
<script type="text/javascript"
	src="http://dylon.github.com/levenshtein_automata/javascripts/v1.1/liblevenshtein.min.js">
</script>
```

Then, within your JavaScript logic, you may use the library as follows:

```javascript
var algorithm = "transposition"; // "standard", "transposition", or "merge_and_split"

var dictionary = [ /* some list of words */ ];
var transduce = levenshtein.transducer({dictionary: dictionary, algorithm: algorithm});

var query_term = "mispelled";
var max_edit_distance = 2;

var accepted = transduce(query_term, max_edit_distance); // list of terms matching your query

var other_term = "oter";
var other_accepted = transduce(other_term, max_edit_distance); // reuse the transducer
```

The default behavior of the transducer is to sort the results, ascendingly, in
the following fashion: first according to the transduced terms' Levenshtein
distances from the query term, then lexicographically, in a case insensitive
manner.  Each result is a pair consisting of the transduced term and its
Levenshtein distance from the query term, as follows: `[term, distance]`

```javascript
var pair, term, distance, i = 0;
while ((pair = accepted[i]) !== undefined) {
	term = pair[0]; distance = pair[1];
	// do something with `term` and `distance`
	i += 1;
}
```

If you would like every term returned, for the purpose of weighting how every
term in your corpus relates to the query term, you need only to set the maximum
allowed edit distance to `Infinity`.

```javascript
var max_edit_distance = Infinity;
var transduce = levenshtein.transducer({dictionary: dictionary, algorithm: algorithm});
// every term will be returned, weighted according to Levenshtein distance
var accepted = transduce(query_term, max_edit_distance);
```

If you would prefer to sort the results yourself, or do not care about order,
you may do the following:

```javascript
var transduce = levenshtein.transducer({
  dictionary: dictionary,
  algorithm: algorithm,
  sort_accepted: false
});
```

The sorting options are as follows:

1. sort_accepted := Whether to sort the terms accepted and returned by the
   transducer (boolean).
2. include_distance := Whether to include the Levenshtein distances with the
	 transduced terms (boolean).
3. case_insensitive := Whether to sort the results in a case-insensitive manner
	 (boolean).

Each sorting option defaults to `true`.  You can get the original behavior of
the transducer by setting each option to `false` (where the original behavior
was to return the terms unsorted and excluding their distances).
