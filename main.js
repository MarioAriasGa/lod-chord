mychord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortGroupsIndex, sortSubgroups, sortChords, groupIndex;
    function relayout() {
      var subgroups = {}, groupSums = [], subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      groupIndex = d3.range(n);
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortGroupsIndex) {
        groupIndex.sort(function(a, b) {
          return sortGroupsIndex(a, b);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
	var theta = 2*Math.PI;
      k = (theta - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
	    origsubindex: j,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroupsIndex = function(x) {
      if (!arguments.length) return sortGroupsIndex;
      sortGroupsIndex = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    chord.groupSum = function() {
	return groupSums;
	}
    chord.groupIndices = function() {
	return groupIndex;
	}
    return chord;
  };


//*******************************************************************
//  CREATE MATRIX AND MAP
//*******************************************************************

function log(arg){
        $("#data").append(arg+"<br/>");
}

function human(n) {
	if(n>1000000) {
		return ((n/1000000)|0)+" M";
	} else if(n>1000) {
		return ((n/1000)|0)+" K";
	} else {
		return n|0;
	}
}


function create1DArray(n) {
	var x = new Array(n);
	for (var i = 0; i < n; i++) {
		x[i]=0;
	}
	return x;
}


function create2DArray(n) {
	var x = new Array(n);
	for (var i = 0; i < n; i++) {
		x[i] = new Array(n);
		for(var j=0;j<n;j++) {
			x[i][j]=0;
		}
	}
	return x;
}

function filterMatrix(matrix, types, min) {
	var rowTotals = [];
	var columnTotals = create1DArray(matrix.length);
	var total=0;
	for(var i=0;i<matrix.length;i++) {
		var rowtotal=0;
		for(var j=0;j<matrix[i].length;j++) {
			rowtotal += matrix[i][j];
			columnTotals[j] += matrix[i][j];
		}
		//log("Row "+i+": "+ matrix[i]+" Total: "+rowtotal+" Global: "+total);
		rowTotals.push(rowtotal);
		total+=rowtotal;
	}

	var todelete = new Array(matrix.length);
	for(var i=0;i<matrix.length;i++) {
		if(rowTotals[i]+columnTotals[i]<min) {
			todelete[i] = true;
		}
	}

	var cnt = 0;
	var newtypes=[];
	for(var i=0;i<todelete.length;i++) {
		if(!todelete[i]) {
			cnt++;
			newtypes.push(types[i]);
		}
	}

	var newmatrix = create2DArray(cnt);
	var row=0;
	for(var i=0;i<matrix.length;i++) {
		if(!todelete[i]) {
			var col=0;
			for(var j=0;j<matrix.length;j++) {
				if(!todelete[j]) {
					newmatrix[row][col]=matrix[i][j];
					col++;
				}
			}
			row++;
		}
	}

	return {matrix:newmatrix, types:newtypes};

	//log("Global: "+total);
}

var data;

function reduce(arr, fun, base) {
	for(var i=0;i<arr.length;i++) {
		var t = arr[i];
		var r = fun(base,t);
		//console.log("SUM "+t);
		//if(t>1000000 || r>1000000) {
			//console.log("WRONG");
		//}
		base += r;
	}
	return base;
}

var w = 1400, h = 1200, r1 = h / 2.4, r0 = r1 - 150, barWidth = 80, textPad=5;
var catFill = d3.scale.category20();
var sizeFilterValue;
var linkFilterValue;

function drawChords(o){


var matrix = o.matrix;
var arr = o.arr;
var hdt = o.hdt;
var maxsize = o.maxsize;
var minsize = o.minsize;

var maxlinks=0;
var minlinks=Number.MAX_VALUE;
var r = o.rowTotals;
var c = o.columnTotals;
for(var i=0;i<r.length;i++) {
	var v = r[i]+c[i];
	minlinks = Math.min(v,minlinks);
	maxlinks = Math.max(v,maxlinks);
}

$('#sizefilter').attr('min', 0).attr('max', Math.log(maxsize+1)).val(sizeFilterValue=0);
$('#linkfilter').attr('min', Math.log(minlinks-1)).attr('max', Math.log(maxlinks+1)).val(linkFilterValue=Math.log(minlinks-1));

var fill = d3.scale.ordinal().range(['#c7b570','#c6cdc7','#335c64','#768935','#507282','#5c4a56','#aa7455','#574109','#837722','#73342d','#0a5564','#9c8f57','#7895a4','#4a5456','#b0a690','#0a3542',]);



var chord = mychord()
    .padding(.014)
    //.sortGroups(d3.descending)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

last_chord = chord;

arcBg = d3.svg.arc().startAngle(0).endAngle(Math.PI*2).innerRadius(r0+2).outerRadius(r0+barWidth);

barScale = d3.scale.log().domain([minsize,maxsize]).range([r0, r0+barWidth]).clamp(true);
//barScale = d3.scale.linear().domain([minsize,maxsize]).range([r0, r0+barWidth]).clamp(true);
arc = d3.svg.arc()
    .innerRadius(r0+2)
    .outerRadius(function(d) {
	return barScale(o.getSize(d.index));
	});

chordGen=d3.svg.chord().radius(r0);

var svg = d3.select("#svgfloat").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .attr("viewBox","0 0 "+w+" "+h)
  .append("svg:g")
    .attr("id", "circle")
    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    /*svg.append("circle")
	.attr("r", r0 + 100);*/

    svg.append("svg:path")
	.style("fill", "#EEEEEE")
	.attr("d", arcBg);

    svg.append("svg:text")
    .attr("dy", ".35em")
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", "15px")
    .attr("fill", "black")
    .attr("transform", "translate("+ (20-w/2)+","+(-35+h/2)+")")
    .text("Visualization by Mario Arias. Data from the Open Knowledge Foundation.");

chord.matrix(matrix);

var g = svg.selectAll("g.group")
    .data(chord.groups())
  .enter().append("svg:g")
    .attr("class", "group")
    .on("mouseover", mouseover)
    .on("mouseout", function (d) {
	chordPaths.style("display",chordFilterFun);
	 d3.select("#tooltip").style("visibility", "hidden") })
    .on("click",function(d) {
		var h = o.getPage(d.index);
		window.open(h, '_blank');
	});

g.append("svg:path")
    .style("stroke", function(d) {
	 return fill(o.getName(d.index)); })
    .style("fill", function(d) {
	 return fill(o.getName(d.index)); })
    .attr("d", function(d,i) {
		/*var dif = d.endAngle-d.startAngle;
		if(dif<0.004) {
			d.endAngle+=0.002;
			d.startAngle-=0.002;
		}*/
		//console.log(dif);
		var r = arc(d,i);
		return r;
	});

g.append("svg:text")
    .each(function(d) {
	 d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", ".35em")
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", "10px")
    .attr("fill", function(d) {
		return d3.rgb(catFill(o.getTopic(d.index))).darker();
	})
    .attr("text-anchor", function(d) {
	 return d.angle > Math.PI ? "end" : null; })
    .attr("transform", function(d) {
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
	  + "translate(" + (r0 + barWidth+textPad) + ")"
	  + (d.angle > Math.PI ? "rotate(180)" : "");
    })
    .text(function(d) {
	 return o.getName(d.index); });

  var chordPaths = svg.selectAll("path.chord")
	.data(chord.chords())
      .enter().append("svg:path")
	.attr("class", "chord")
	//.style("opacity", .8)
	.style("stroke", function(d) {
	 return d3.rgb(fill(o.getName(d.source.index))).darker()})
	.style("fill", function(d) {
	 return fill(o.getName(d.source.index)) })
	.attr("d", chordGen)
	.on("mouseover", function (d) {
	  d3.select("#tooltip")
	    .style("visibility", "visible")
	    .html(chordTip(d))
	    .style("top", function () {
	 return (d3.event.pageY - 170)+"px"})
	    .style("left", function () {
	 return (d3.event.pageX - 100)+"px";})
	})
	.on("mouseout", function (d) {
		chordPaths.style("display",chordFilterFun);
		 d3.select("#tooltip").style("visibility", "hidden") })
	.on("click",function(d) {
		var h = o.getPage(d.source.index);
		window.open(h, '_blank');
	})
	;

  function chordTip (d) {
    var p = d3.format(".1%"), q = d3.format(",.2r")
	var srcName = o.getName(d.source.index);
	var targetName = o.getName(d.target.index);
	var srcCount = o.rowTotals[d.source.index];
	var dstCount = o.columnTotals[d.target.index];

    return "Links:<br/>"
      +  srcName + " → " + targetName
      + ": " + human(d.source.value) + " links <br/>"
      + p(d.source.value/srcCount) + " of " + srcName + "'s Total<br/>"
      + "<br/>"
      + targetName + " → " + srcName
      + ": " + human(d.target.value) + " links <br/>"
      + p(d.target.value/dstCount) + " of " + targetName + "'s Total<br/>"
  }

  function groupTip (d) {
    var p = d3.format(".1%"), q = d3.format(",.2r")
	var name = o.getTitle(d.index);
	var triples = human(o.getSize(d.index));
	//var url = o.getURL(d.index);
	var topic = o.getTopic(d.index);
	var linksOut = human(o.rowTotals[d.index]);
	var linksIn = human(o.columnTotals[d.index]);
    return "<b>"+name+"</b> ("+topic+")<br/>"
	//+ "URL: "+url+" <br/>"
	+ " Statements: "+ triples+"<br/>"
	+ " Total outgoing links: "+linksOut+ " to "+o.rowTotals2[d.index]+ " datasets.<br/>"
	+ " Total incoming links: "+linksIn+" from "+o.columnTotals2[d.index]+" datasets";
  }

  function mouseover(d, i) {
    d3.select("#tooltip")
      .style("visibility", "visible")
      .html(groupTip(d))
      .style("top", function () {
	 return (d3.event.pageY - 120)+"px"})
      .style("left", function () {
	 return (d3.event.pageX - 10)+"px";})

	chordPaths.style("display", function(p) {
		var ff = chordFilterFun(p);
		if(ff!=null) {
			return ff;
		}
      return (p.source.index == i
	  || p.target.index == i) ? null : "none";
    });

  }
}

function rerender(order) {
	var oldCh = last_chord;
	var chord = mychord()
		.padding(.014)
		.sortSubgroups(d3.descending)
		.sortChords(d3.descending);

	if(order==1) {
	    //chord.sortGroups(d3.descending);
	} else if(order==2) {
	    chord.sortGroupsIndex(function(a,b) {
		return d3.descending(data.getSize(a), data.getSize(b));
		});
	} else if(order==3) {
	    chord.sortGroupsIndex(function(a,b) {
		return d3.descending(data.getTopic(a),data.getTopic(b));
		});
	} else if(order==4) {
	    chord.sortGroupsIndex(function(a,b) {
			var x = data.rowTotals[a]+data.columnTotals[a];
			var y = data.rowTotals[b]+data.columnTotals[b];
		return d3.descending(x,y);
		});
	} else if(order==5) {
	    chord.sortGroupsIndex(function(a,b) {
			var x = data.rowTotals2[a]+data.columnTotals2[a];
			var y = data.rowTotals2[b]+data.columnTotals2[b];
		return d3.descending(x,y);
		});
	}

	chord.matrix(data.matrix);

	var svg = d3.select("svg");

	// Generate categories
	if(order==3)
	{
		var grp = chord.groups();
		var idx = chord.groupIndices();
		var topics=[];
		var last;
		var lastIdx=0;
		var startAngle=0;
		var endAngle;
	    for(var i=0;i<grp.length;i++) {
			var el = idx[i];
			var g = grp[el];
			var topic = data.getTopic(el);
			//if(i==0) {
			if(lastIdx==i) {
				last=topic;
				lastIdx=i;
				endAngle=g.endAngle;
			}
			if(topic!=last) {
				topics.push({first:lastIdx, last:i, startAngle:startAngle, endAngle:endAngle, topic:last, index:topics.length});

				startAngle = g.startAngle;
				lastIdx=i+1;
			}
			endAngle=g.endAngle;
		}
		// Special case: Last
		{
			var el = idx[grp.length-1];
			var g = grp[el];
			var topic = data.getTopic(idx[grp.length-1]);
			topics.push({first:lastIdx, last:grp.length-1, startAngle:startAngle, endAngle:g.endAngle, topic:topic, index:topics.length});
		}
		// Hardcoded heights :(
		var he = [125,115,120,170,150,140,140,140,160,120];
		var wi = [  0,  0,  0,  0, -0.05,  0,  0, 0.02,  0.05, 0];
		for(var i=0;i<topics.length;i++) {
			topics[i].height = he[i];
			topics[i].offset = 0;
			topics[i].angle = (topics[i].endAngle+topics[i].startAngle)/2+wi[i];
			topics[i].width = topics[i].endAngle-topics[i].startAngle;
		}

		var catArc = d3.svg.arc().innerRadius(r0+barWidth+1).outerRadius(r0+barWidth+5);

		var g = svg.selectAll("g.cat").data(topics)
			.enter()
			.append("svg:g")
    				.attr("class", "cat")

			.on("mouseover",function(d,i) {
				var topic = d.topic;
				 svg.selectAll("path.chord")
				 .style("display", function(p) {
					      return (data.getTopic(p.source.index) == topic
						  || data.getTopic(p.target.index) == topic) ? null : "none";
					    })
				})
			.on("mouseout", function(d,i) {
				 svg.selectAll("path.chord")
					.style("display", chordFilterFun);
				})

			g.append("svg:path")
			    .style("stroke", function(d) {
				 return catFill(d.topic); })
			    .style("fill", function(d) {
				 return catFill(d.topic); })
			    .attr("d", catArc)
    				.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")
				.style("opacity",0)

				.transition()
				.duration(1500)
				.style("opacity",1)

			g.append("svg:text")
				.attr("dy", ".35em")
				    .style("font-family", "helvetica, arial, sans-serif")
				    .style("font-size", "20px")
				.style("fill", function(d) {
						return d3.rgb(catFill(d.topic)).darker(); 
					})
				    .attr("text-anchor",function(d) {
						return d.width<0.2 ? null : "middle";
					})
				    .attr("transform", function(d) {
					var a = d.angle;
					var ad = (a*180)/Math.PI;
					var str = "translate("+(w/2)+","+(h/2)+")"+
						  "rotate(" + (ad+180) + ")"+
					          "translate("+d.offset+","+(r0+barWidth+d.height)+")";
					if(d.width<0.2) {
						 str+="rotate(155)";
					} else {
						 str+="rotate(180)";
					}
					console.log(d.topic+" "+a+" / "+ad+ " / "+d.width+" => "+str);
					return str;
				    })
				    //.text(function(d) { return d.index+" "+d.topic; })
				    .text(function(d) { return d.topic.length>0 ? d.topic : "Other"; })
				    .style("opacity",0)

				    .transition()
				    .duration(1500)
				    .style("opacity",1);




		textPad=10;
	} else {
		svg.selectAll("g.cat").data([]).exit().transition().duration(1500).style("opacity",0).remove();
				//.each("end", function(d) { d.remove() })
		textPad=5;
	}




var arc =  d3.svg.arc()
      .innerRadius(r0+2)
      .outerRadius(function(d){
		return barScale(data.getSize(d.index));
	});

	  // update arcs
	var g = svg.selectAll("g.group")
			.data(chord.groups())
			.transition()
			.duration(1500);

		g.selectAll("path")
			.attrTween("d", function(d,i,a) {
				var old = oldCh.groups()[d.index];
				var n = chord.groups()[d.index];
				var ip = d3.interpolate(old,n);

				return function(t) {
					return arc(ip(t));
				}
			});

		g.selectAll("text")
			.attrTween("transform", function(d,i,a) {
				var el = chord.groups()[d.index];
				el.angle = (el.startAngle+el.endAngle)/2;
				var newT = "rotate(" + (el.angle * 180 / Math.PI - 90) + ")" + "translate(" + (r0 + barWidth+textPad) + ")" + (el.angle > Math.PI ? "rotate(180)" : "");
				return d3.interpolate(a,newT);
			})
			.attr("text-anchor", function(d,i) {
				var el = chord.groups()[d.index];
				 return el.startAngle > Math.PI ? "end" : null;
			});

	svg.selectAll(".chord")
		.data(chord.chords())
		.transition()
		.duration(1500)
		.attrTween("d", function(d,i,a){
			var old = oldCh.chords()[i];
			var el = chord.chords()[i];
			var i = d3.interpolate(old,el);

			return function(t) {
				return chordGen(i(t));
			}
		});

	last_chord = chord;
}

function DoFullScreen() {
    var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
            (document.mozFullScreen || document.webkitIsFullScreen);

    var docElm = document.documentElement;
    if (!isInFullScreen) {

        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        }
        else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        }
        else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        }
    }

    $('html,body').animate({scrollTop: $("#svgcontainer").offset().top},'slow'); 
}

function saveSvg(tag) {
	var svg = document.getElementsByTagName("svg")[0];

	// Extract the data as SVG text string
	var svg_xml = (new XMLSerializer).serializeToString(svg);

	var pos = svg_xml.indexOf('>');
	if(svg_xml.substring(0, pos).indexOf('xmlns')==-1) {
		svg_xml = svg_xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
	}

	var blob = new Blob([svg_xml],{type:'image/svg+xml;charset=utf-8'});
        var url = URL.createObjectURL(blob);
        tag.href = url;
        tag.download = "lodchord.svg";
	return true;
}

function savePng(tag) {
	var svg = document.getElementsByTagName("svg")[0];

	// Extract the data as SVG text string
	var svg_xml = (new XMLSerializer).serializeToString(svg);

	var pos = svg_xml.indexOf('>');
	if(svg_xml.substring(0, pos).indexOf('xmlns')==-1) {
		svg_xml = svg_xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
	}

	var blob = new Blob([svg_xml],{type:'image/svg+xml;charset=utf-8'});
        var url = URL.createObjectURL(blob);

	var canvas = document.createElement("canvas");
	canvas.setAttribute("width", w);
	canvas.setAttribute("height", h);
	var cc = document.getElementById('canvascontainer')
	cc.appendChild(canvas);

	var img = new Image();
	img.onload = function() {
		var ctx=canvas.getContext("2d");
		ctx.drawImage(img, 0,0);
		URL.revokeObjectURL(url);
		var image = canvas.toDataURL("image/png");
		var a = document.createElement("a");
		a.href = image;
		a.download = "lodchord.jpg";
		//a.innerHTML = "HELLO";
		cc.appendChild(a);
		a.click();
		cc.removeChild(a);
		cc.removeChild(canvas);
	}
	img.src = url;

	return false;
}

function size(i) {
	return Math.log(data.getSize(i));
}
function links(i) {
	return Math.log(data.rowTotals[i]+data.columnTotals[i]);
}

function groupFilterFun(p) {
      return size(p.index) >= sizeFilterValue && links(p.index) >= linkFilterValue ? null : "none";
}

function chordFilterFun(p) {
      return (size(p.source.index) >= sizeFilterValue && size(p.target.index) >= sizeFilterValue
		&& links(p.source.index) >= linkFilterValue && links(p.target.index) >= linkFilterValue)
		 ? null : "none";
}

function applyFilters() {
	var svg = d3.select("svg")
	svg.selectAll("path.chord")
		 .style("display", chordFilterFun);

	svg.selectAll("g.group")
		 .style("display", groupFilterFun);
}

$(function(){
 	$( "#menu" ).selectable({selected: function(ev,ui){
		rerender(ui.selected.id);
	}});
	$("#sizefilter").on("change", function(e,ui) {
		sizeFilterValue = $(this).val();
		applyFilters();
		$("#sizefilterlabel").val(">"+human(Math.pow(Math.E,sizeFilterValue)-1));
	});
	$("#linkfilter").on("change", function(e,ui) {
		linkFilterValue = $(this).val();
		applyFilters();
		$("#linkfilterlabel").val(">"+human(Math.pow(Math.E,linkFilterValue)-1));
	});

	readJSON("lod.json");
});
