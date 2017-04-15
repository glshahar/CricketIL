
function BufferedSink(opts){
    this.maxSize = opts.maxSize || 10;
    this.writeItems = opts.writeItems;
    this.cache = []; // Items are stored here until cache.length reaches maxSize.
    this.tempCache = []; // This is used store items while real writing taking place.
    this.isWriting = false;
}

BufferedSink.prototype.flush = function(cb){
    var self = this;
    this.isWriting = true;
    this.writeItems(this.cache, function(err){
        self.cache = self.tempCache;
        self.tempCache = [];
        self.isWriting = false;
        if(err){ return cb(err); }
        return cb.apply(null, [].slice.call( arguments ) );
    });
};

BufferedSink.prototype.$writeArray = function(items, cb) {
    if ( this.isWriting ){
        this.tempCache = this.tempCache.concat( items );
        cb( null );
    } else {
        this.cache = this.cache.concat( items );
        if ( this.cache.length < this.maxSize ){
            return cb( null );
        }
        this.flush( function(err){
            if(err) { return cb(err); }
            return cb( null );
        });
    }
};

BufferedSink.prototype.$write = function(item, cb) {
    if ( this.isWriting ){
        this.tempCache.push( item );
        cb( null );
    } else {
        this.cache.push( item );
        if ( this.cache.length < this.maxSize ){
            return cb( null );
        }
        this.flush( function(err){
            if(err) { return cb(err); }
            return cb( null );
        });
    }
};

BufferedSink.prototype.write = function(data, cb) {
    if( data.constructor.name === 'Array' ){
        return this.$writeArray( data, cb );
    }
    this.$write( data, cb );
};

module.exports = BufferedSink;
