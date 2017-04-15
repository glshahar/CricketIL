Buffered-Sink
=============

A general purpose Nodejs class that can be used to write data to any data sinks, with buffering.
It's working is similar to underscore.js 's after() funnction. But it take care of some other situations too.

# Usage

```javascript
var BufferedSink = require('buffered-sink');

var jsonFileSink = new BufferedSink( {
    maxSize: 5,
    writeItems: function(items, cb){
        var existing;
        try {
            existing = JSON.parse( fs.readFileSync( outFile, 'utf-8' ) );
        } catch(e){
            existing = [];
        }
        var total = existing.concat( items );
        fs.writeFile( outFile, JSON.stringify(total, null, ' '), 'utf-8', cb );
    }
});

jsonFileSink.$write({ title: 'first'}, cb ); // No real write. data is stored in memmoy
jsonFileSink.$write({ title: 'second'}, cb ); // No real write. data is stored in memmoy
jsonFileSink.$write({ title: 'third'}, cb ); // No real write. data is stored in memmoy
jsonFileSink.$write({ title: 'fourth'}, cb ); // No real write. data is stored in memmoy
jsonFileSink.$write({ title: 'fifth'}, cb ); // real write occurs. calls writeItems funnction provided in constructor internally.
```

# Documentation
## Class BufferedSink

### Constructor : new BufferedSink( opts );
* `opts.maxSize`: {Integer} maximum size of internal buffer.
* `opts.writeItems`: {funnction( items, callback )} A function that does real writing.

### Methods

#### `$writeItems( items, cb )`
Writes an array of items.

#### `$write( items, cb )`
Writes a single item.

#### `flush( cb )`
Do real writing and empty the buffer.

### Internal variable that holds state

#### cache: Array
Used to store items. Used as a buffer store.

#### tempCache: Array
Used to store items at the moment when real writing is taking place. To be precise, if this.isWriting == true.

#### isWriting: Boolean
A flag that used to indicate whether real writing is taking place or not.

