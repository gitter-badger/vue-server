var _ = require('../util');
var Path = require('../parsers/path');
var toArray = function (value) {
    if (_.isArray(value)) {
        return value;
    } else if (_.isPlainObject(value)) {
        // convert plain object to array.
        var keys = Object.keys(value);
        var i = keys.length;
        var res = new Array(i);
        var key;
        while (i--) {
            key = keys[i];
            res[i] = {
                $key: key,
                $value: value[key]
            };
        }
        return res;
    } else {
        var type = typeof value;
        if (type === 'number') {
            value = range(value);
        } else if (type === 'string') {
            value = _.toArray(value);
        }
        return value || [];
    }
};

/**
 * Filter filter for v-repeat
 *
 * @param {String} searchKey
 * @param {String} [delimiter]
 * @param {String} dataKey
 */

exports.filterBy = function (arr, search, delimiter /* ...dataKeys */) {
    arr = toArray(arr);
    if (search === null) {
        return arr;
    }
    if (typeof search === 'function') {
        return arr.filter(search);
    }
    // cast to lowercase string
    search = ('' + search).toLowerCase();
    // allow optional `in` delimiter
    // because why not
    var n = delimiter === 'in' ? 3 : 2;
    // extract and flatten keys
    var keys = _.toArray(arguments, n).reduce(function (prev, cur) {
        return prev.concat(cur);
    }, []);
    var res = [];
    var item, key, val, j;
    for (var i = 0, l = arr.length; i < l; i++) {
        item = arr[i];
        val = (item && item.$value) || item;
        j = keys.length;
        if (j) {
            while (j--) {
                key = keys[j];
                if ((key === '$key' && contains(item.$key, search)) ||
                    contains(Path.get(val, key), search)) {
                    res.push(item);
                }
            }
        } else {
            if (contains(item, search)) {
                res.push(item);
            }
        }
    }
    return res;
};

/**
 * Filter filter for v-repeat
 *
 * @param {String} sortKey
 * @param {String} reverse
 */

exports.orderBy = function (arr, sortKey, reverse) {
    arr = toArray(arr);
    if (!sortKey) {
        return arr;
    }
    if (process.env.NODE_ENV !== 'production') {
        if (arguments.length > 2 && typeof reverse !== 'number') {
            _.deprecation.ORDER_BY_REVERSE();
        }
    }
    var order = (reverse && reverse < 0) ? -1 : 1;
    // sort on a copy to avoid mutating original array
    return arr.slice().sort(function (a, b) {
        if (sortKey !== '$key') {
            if (_.isObject(a) && '$value' in a) {
                a = a.$value;
            }
            if (_.isObject(b) && '$value' in b) {
                b = b.$value;
            }
        }
        a = _.isObject(a) ? Path.get(a, sortKey) : a;
        b = _.isObject(b) ? Path.get(b, sortKey) : b;
        return a === b ? 0 : a > b ? order : -order;
    });
};

/**
 * String contain helper
 *
 * @param {*} val
 * @param {String} search
 */

function contains(val, search) {
    var i;
    if (_.isPlainObject(val)) {
        var keys = Object.keys(val);
        i = keys.length;
        while (i--) {
            if (contains(val[keys[i]], search)) {
                return true;
            }
        }
    } else if (_.isArray(val)) {
        i = val.length;
        while (i--) {
            if (contains(val[i], search)) {
                return true;
            }
        }
    } else if (val !== null) {
        return val.toString().toLowerCase().indexOf(search) > -1;
    }
}
