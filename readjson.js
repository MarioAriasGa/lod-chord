function readJSON(url) {
	d3.json(url, function(error,json) {
		if(error) return console.warn(error);
		var n = json.metadata.length;
		var matrix = create2DArray(n);
		var matrix2 = create2DArray(n);

		var rowTotals = create1DArray(n);
		var rowTotals2 = create1DArray(n);
		var columnTotals = create1DArray(n);
		var columnTotals2 = create1DArray(n);

		for(var a in json.matrix) {
			var coord = a.split('-');
			var x = coord[0], y = coord[1];
			var values = json.matrix[a];

			matrix[x][y] = values[1];
			matrix2[x][y] = values[0];

			rowTotals[x] += values[1];
			rowTotals2[x] += values[0];

			columnTotals[y] += values[1];
			columnTotals2[y] += values[0];
		}
		
		// Compute max/min
		var maxsize = 0; var minsize = Number.MAX_VALUE;
		for(var i=0;i<n;i++) {
			var el = json.metadata[i];
			el.index = i;
			var size = el.size;
			if(size>maxsize) {
				maxsize = size;
			}
			if(size>1 && size<minsize) {
				minsize = size;
			}
		}

		var o = {metadata:json.metadata, matrix:matrix, matrix2:matrix2, rowTotals:rowTotals, rowTotals2:rowTotals2, columnTotals:columnTotals, columnTotals2:columnTotals2, maxsize:maxsize, minsize:minsize};

		o.getName = function(idx) {
			return this.metadata[idx].name;
		};

		o.getURL = function(idx) {
			return this.metadata[idx].url;
		};

		o.getPage = function(idx) {
			return this.metadata[idx].page;
		};	

		o.getTitle = function(idx) {
			return this.metadata[idx].title;
		};

		o.getTopic=function(idx) {
			return this.metadata[idx].topic;
		};

		o.getSize=function(idx) {
			return this.metadata[idx].size;
		};

		data = o;
	
		drawChords(o);
	});
}
