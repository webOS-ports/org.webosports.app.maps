function OSMMapType(Preferences) {
	
	this.MapCacheBasePath = Preferences.MapCacheExternal ? "/media/internal/.MapTool/" : "/media/internal/appdata/cz.72ka.googlemaps/cache/OSM/";
};

OSMMapType.prototype = {
			
//tileSize: new google.maps.Size(256, 256),
tileSize: {width: 256, height: 256, D: "px", I: "px"},
isPng: true,
name: "OpenStreetMap",
credit: 'OpenStreetMap',
maxZoom: 18,
			
getTile: function(coord, zoom, ownerDocument) {
					
					this.checkFileExist(this.MapCacheBasePath + zoom + "/" + coord.x + "/" + coord.y + ".png", zoom, coord.x, coord.y, ownerDocument);
					
					var tileUrl = this.MapCacheBasePath + zoom + '/' + coord.x + '/' + coord.y + '.png';
					
					

					var tile = ownerDocument.createElement('img');
					tile.width = this.tileSize.width;
					tile.height = this.tileSize.height;
					tile.src = tileUrl;
					tile.id = "NoTrans" + zoom.toString() + coord.x.toString() + coord.y.toString();

					return tile;
				},

				checkFileExist: function (path, zoom, x, y, ownerDocument) {

					var xhr = new XMLHttpRequest();

					  xhr.onreadystatechange = 
						function(){
						  if (xhr.readyState == 4){
							if (xhr.status == 200){
							  return true;
							}
							else {
							  this.downloadTile("http://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png", zoom, x, y, ownerDocument);
							}
						  }
						}.bind(this);

					  xhr.open("HEAD", path, true);
					  xhr.send();
				},

				downloadTile: function (path, zoom, x, y, ownerDocument) {
					
					var tile = document.getElementById("NoTrans" + zoom.toString() + x.toString() + y.toString());
					tile.src = "images/saving-to-cache.png";

					var service = new enyo.ServiceRequest({
							service: 'palm://com.palm.downloadmanager/', 
							method: 'download',
							x: x,
							y: y,
							ownerDocument: ownerDocument,
							zoom: zoom
							});
					service.response(this, "downloadSuccess");
					service.error(this, "downloadFailure");
					service.go({
						target: path,
						targetDir : this.MapCacheBasePath + zoom + "/" + x + "/",
						targetFilename : y + ".png"
					});
				},
							
				downloadSuccess: function (resp) {
					this.refreshTile(resp.target, resp.zoom, resp.x, resp.y, resp.ownerDocument);
				},

				downloadFailure: function (e) {
					enyo.log("Error while downloading tile.");
				},

				refreshTile: function (tile, zoom, x, y, ownerDocument) {
						var tile = document.getElementById("NoTrans" + zoom.toString() + x.toString() + y.toString());
						tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png";
				}

			
};
