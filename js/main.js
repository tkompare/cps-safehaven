(function(){
	// jQuery on document.ready
	$(function(){
		if(navigator.geolocation)
		{
			$('#findme-span').html('&nbsp;&nbsp;<button id=address-gps class="btn btn-inverse btn-small" type=button>Find Me</button>');
		}
		
		// Default values object
		var Default = {
			// The map's DOM object ID
			domid:'map',
			// Start center latutude of the Google map
			lat:41.875,
			// Start center longitude of the Google map
			lng:-87.6425,
			// The TkMap styles wanted
			styles:'grey minlabels',
			// Initial zoom level for the Google map
			zoom:12,
			// The circle
			Circle:null,
			// The address marker
			AddressMarker:null,
			// Google Fusion Tables URI
			fturl:'https://www.googleapis.com/fusiontables/v1/query',
			// Google maps API key
			googlemapsapikey:'AIzaSyCtCkkIUFPAWpAbARZdRYmRfgTrQqywNjk',
			// Google Fusion Tables SQL-like query string for school location data
			safehavenquery:'SELECT lat, lng, name, pastor, address, postalcode, phone FROM 1bX4b3qiLX8FYBcEBnthy6X94YSEUV6dDs2QCBFo',
			// SafeHaven Array
			SafeHavens:[],
			// infobox.js options
			infoboxoptions:{
				disableAutoPan: false,
				maxWidth: 0,
				pixelOffset: new google.maps.Size(-101, 0),
				zIndex: null,
				boxStyle: {
					background: "url('img/tipbox.gif') no-repeat",
					opacity: 0.92,
					width: "200px"
				},
				closeBoxMargin: "11px 4px 4px 4px",
				closeBoxURL: "img/close.gif",
				infoBoxClearance: new google.maps.Size(20, 30),
				visible: false,
				pane: "floatPane",
				enableEventPropagation: false
			},
			getSafeHavens:function(columns,rows,Map)
			{
				// Copy the Safe Haven Location data to the Safe Haven object
				for (var i in rows)
				{
					this.SafeHavens[i] = new SafeHaven();
					for(var j in columns)
					{
						var colname = columns[j];
						this.SafeHavens[i].data[colname] = rows[i][j];
					}
					// Create the Google LatLng object
					this.SafeHavens[i].latlng = new google.maps.LatLng(this.SafeHavens[i].data.lat,this.SafeHavens[i].data.lng);
					// Create the markers for each school
					this.SafeHavens[i].marker = new google.maps.Marker({
						position: this.SafeHavens[i].latlng,
						map: Map.Map,
						icon:'img/orange.png',
						shadow:'img/msmarker.shadow.png',
						clickable:false
					});
					// Info boxes
					this.SafeHavens[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:#333; padding:5px; color:white; font-size:90%;">'+
					this.SafeHavens[i].data.name+'<br>'+
					this.SafeHavens[i].data.address+'<br>Chicago, IL '+this.SafeHavens[i].data.postalcode+
					'</div>';
					var options = this.infoboxoptions;
					options.content = this.SafeHavens[i].infoboxtext;
					// Make the info box
					this.SafeHavens[i].infobox = new InfoBox(options);
				}
				for(var i in this.SafeHavens)
				{
					google.maps.event.addListener(this.SafeHavens[i].marker, 'click', this.SafeHavens[i].toggleInfoBox(Map.Map,this.SafeHavens[i].marker,this.SafeHavens[i].infobox));
				}
			},
			// Oh dear lord, browser detection. -10 Charisma. Is the browser android or iPhone?
			isPhone:(navigator.userAgent.match(/iPhone/i) || (navigator.userAgent.toLowerCase().indexOf("android") > -1) || (navigator.userAgent.toLowerCase().indexOf("blackberry") > -1)) ? true : false
		};
		
		/**
		 * Safe Haven class
		 */
		var SafeHaven = (function(){
			var constructor = function()
			{
				this.data = {};
				this.latlng = null;
				this.marker = null;
				this.infobox = null;
				this.infoboxtext = null;
				
				this.toggleInfoBox = function(Map,Marker,InfoBox)
				{
					return function(){
						if(InfoBox.visible)
						{
							InfoBox.close(Map,Marker);
						}
						else
						{
							InfoBox.open(Map,Marker);
						}
					};
				};
				
				this.closeInfoBox = function(Map,Marker,InfoBox)
				{
					if(InfoBox.visible)
					{
						InfoBox.close(Map,Marker);
					}
				};
				
			};
			return constructor;
		})();
		
		/**
		 * Google Fusion Table connector and data
		 */
		var FusionTable = (function(){
			var constructor = function(url,query,googlemapsapikey)
			{
				this.columns = null;
				this.rows = null;
				this.url = url+'?sql='+encodeURIComponent(query)+'&key='+googlemapsapikey+'&callback=?';
			};
			return constructor;
		})();
		
		// The Google map base layer object
		var Map = new TkMap({
			domid:Default.domid,
			lat:Default.lat,
			lng:Default.lng,
			styles:Default.styles,
			zoom:Default.zoom
		});
		
		// Start processing
		$('#address,#results,#noresults').hide();
		Map.initMap();
		Map.setPanZoom(false);
		
		// Get the Safe Haven locations
		var SafeHavensFT = new FusionTable(Default.fturl,Default.safehavenquery,Default.googlemapsapikey);
		$.ajax({
			url: SafeHavensFT.url,
			dataType: 'jsonp',
			success: function (ftdata) {
				SafeHavensFT.columns = ftdata.columns;
				SafeHavensFT.rows = ftdata.rows;
				Default.getSafeHavens(SafeHavensFT.columns,SafeHavensFT.rows,Map);
			}
		});
		
		// Listeners
		$('#start-find').click(function(){
			$('#start').hide();
			$('#address').show();
		});
		
		// Learn More button
		$('#start-learn').click(function(){
			document.getElementById('learn').scrollIntoView();
		});
		
		$('#learn-start,#learn-end').click(function(){
			document.getElementById('before-map-fluid').scrollIntoView();
		});
		
		$('body').on('click','a[href^="tel:"]',function(){
			_gaq.push(['_trackEvent', 'Phone Call Attempt', 'Click', $(this).attr('id')]);
		});
		
		$('body').on('click','#newsearch',function(){
			_gaq.push(['_trackEvent', 'New Search Button', 'Click']);
			$('#results').hide();
			$('#address').show();
			$('#results').html('');
			for(var i in Default.SafeHavens)
			{
				Default.SafeHavens[i].infobox.close(Map.Map,Default.SafeHavens[i].marker);
			}
			Default.Circle.setVisible(false);
			Default.Circle = null;
			Default.AddressMarker.setVisible(false);
			Default.AddressMarker = null;
			var mapcenter = new google.maps.LatLng(Default.lat,Default.lng);
			Map.Map.panTo(mapcenter);
			Map.Map.setZoom(Default.zoom);
			document.getElementById('before-map-fluid').scrollIntoView();
		});
		
		// Accordion toggle listener
		$('body').on('click','.accordion-toggle',function(){
			var safehavenid = String($(this).attr('id')).replace(/[^0-9]/g,'');
			if($(this).attr('class').match(/collapse/) !== null || $('#collapse-'+safehavenid).attr('class').match(/in/) === null)
			{
				for(var i in Default.SafeHavens)
				{
					Default.SafeHavens[i].infobox.close(Map.Map,Default.SafeHavens[i].marker);
				}
				Map.Map.panTo(Default.SafeHavens[safehavenid].latlng);
				Map.Map.setZoom(15);
				Default.SafeHavens[safehavenid].infobox.open(Map.Map,Default.SafeHavens[safehavenid].marker);
				_gaq.push(['_trackEvent', 'HavenDetails', 'Click', Default.SafeHavens[safehavenid].data.name]);
			}
			else
			{
				if(! Map.Map.getCenter().equals(Default.Circle.getCenter()))
				{
					Default.SafeHavens[safehavenid].closeInfoBox(Map.Map,Default.SafeHavens[safehavenid].marker,Default.SafeHavens[safehavenid].infobox);
					Map.Map.panToBounds(Default.Circle.getBounds());
					Map.Map.fitBounds(Default.Circle.getBounds());
					if(Number($('#address-radius').val()) !== 6 && Number($('#address-radius').val()) !== 3)
					{
						Map.Map.setZoom((Map.Map.getZoom() + 1));
					}
					Map.Map.panTo(Default.Circle.getCenter());
				}
			}
		});
		
		$('#address-search').click(function(){
			if($('#address-input').val() !== '')
			{
				// Open the results div
				$('#address').hide();
				$('#results').show();
				_gaq.push(['_trackEvent', 'Search Radius', 'Search', $('#address-radius').val()]);
				// Give me all the search
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode(
					{address:$('#address-input').val()+', Chicago, Illinois'},
					function(results, status)
					{
						if (status == google.maps.GeocoderStatus.OK)
						{
							if (results[0])
							{
								// Mask the exact address before recording
								var addarray = $('#address-input').val().replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(' ');
								if(addarray[0].match(/^[0-9]+$/) !== null)
								{
									var replacement = addarray[0].substr(0,addarray[0].length-2)+'00';
									if(replacement !== '00')
									{
										addarray[0] = replacement;
									}
									else
									{
										addarray[0] = '0';
									}
								}
								var maskedAddress = addarray.join(' ');
								_gaq.push(['_trackEvent', 'Address Found', 'Search', maskedAddress]);
								if(Default.Circle !== null)
								{
									Default.Circle.setCenter(results[0].geometry.location);
									Default.Circle.setRadius(Number($('#address-radius').val()));
								}
								else
								{
									google.maps.Circle.prototype.contains = function(latLng) {
									  return this.getBounds().contains(latLng) && google.maps.geometry.spherical.computeDistanceBetween(this.getCenter(), latLng) <= this.getRadius();
									};
									Default.Circle = new google.maps.Circle({
										center:results[0].geometry.location,
										clickable:false,
										fillOpacity:0.075,
										map:Map.Map,
										radius:(Number($('#address-radius').val())*1609),
										strokeWeight:1
									});
								}
								Map.Map.panToBounds(Default.Circle.getBounds());
								Map.Map.fitBounds(Default.Circle.getBounds());
								if(Number($('#address-radius').val()) !== 6 && Number($('#address-radius').val()) !== 3)
								{
									Map.Map.setZoom((Map.Map.getZoom() + 1));
								}
								Default.AddressMarker = new google.maps.Marker({
									position:results[0].geometry.location,
									map: Map.Map,
									icon:'/img/close.gif',
									clickable:false
								});
								Map.Map.panTo(results[0].geometry.location);
								var numresults = 0;
								var resultHTML = '';
								for(var i in Default.SafeHavens)
								{
									if(Default.Circle.contains(Default.SafeHavens[i].latlng))
									{
										numresults++;
										if(numresults === 1)
										{
											resultHTML += '<div class=padded><p>This summer\'s program begins on July 1 and runs through August 13, Monday - Friday from 10:00 A.M. - 2:00 P.M. All activities and meals (breakfast and lunch are provided) are <b>free for CPS students</b>.</p></div>';
											if(Number($('#address-radius').val()) > 1)
											{
												resultHTML += '<div><h4>Safe Havens within '+$('#address-radius').val()+' miles:</h4></div>';
											}
											else
											{
												resultHTML += '<div><h4>Safe Havens within '+$('#address-radius').val()+' mile:</h4></div>';
											}
											resultHTML += '<div class="accordion" id="accordion">';
										}
										resultHTML += '<div class="accordion-group">';
											resultHTML += '<div class="accordion-heading" style="background-color:#ddd;"><a id="accordion-toggle-'+i+'" class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion" href="#collapse-'+i+'" style="color:#358">';
												resultHTML += Default.SafeHavens[i].data.name+'&nbsp;&nbsp;(more info)';
											resultHTML += '</a></div>';
											resultHTML += '<div id="collapse-'+i+'" class="accordion-body collapse"><div class="accordion-inner" style="background-color:#eee;">';
												resultHTML += Default.SafeHavens[i].data.pastor+'<br>';
												resultHTML += Default.SafeHavens[i].data.address+'<br>Chicago, IL '+Default.SafeHavens[i].data.postalcode+'<br>';
												var phone = String(Default.SafeHavens[i].data.phone).replace(/[^0-9]/g,'');
												var phonetext = '';
												if(Default.isPhone)
												{
													phonetext = '<a id="'+Default.SafeHavens[i].data.name+' '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'" href="tel:+1'+phone.slice(-10)+'" style="color:#f87217"><u>'+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'</u></a>';
												}
												else
												{
													phonetext = phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4);
												}
												resultHTML += phonetext+'<br>';
												resultHTML += '<small>(call for registration information)</small>';
											resultHTML += '</div></div>';
										resultHTML += '</div>';
									}
								}
								_gaq.push(['_trackEvent', 'Number of Results', 'Search', String(numresults)]);
								if(numresults > 0)
								{
									resultHTML += '</div>';
								}
								else
								{
									resultHTML += '<h4>We\'re sorry. We could locate a Safe Haven location within your search radius. Try increasing distance.</h4>';
								}
								resultHTML += '<div class=marginb2><button id=newsearch class="btn btn-warning btn-small">New Search</button></div>';
								$('#results').html(resultHTML);
								document.getElementById('before-map-fluid').scrollIntoView();
							}
							else
							{
								alert('Sorry! We couldn\'t find that address.');
							}
						}
						else
						{
							alert('Sorry! We couldn\'t find that address.');
						}
					}
				);
			}
			else
			{
				alert("Please enter an address so we know where to center our search.");
			}
		});
		
		// Find me by device gps
		$('body').on('click','#address-gps',function(){
			_gaq.push(['_trackEvent', 'Find Me Button', 'Click']);
			if(navigator.geolocation)
			{
				navigator.geolocation.getCurrentPosition(
					// Success
					function(position)
					{
						_gaq.push(['_trackEvent', 'GPS Success', 'Aquired From Device']);
						var latlng = new google.maps.LatLng(
							position.coords.latitude,
							position.coords.longitude
						);
						codeLatLng(latlng);
					},
					// Failure
					function()
					{
						alert('We\'re sorry. We could not find you.');
					}
				);
			}
		});
	});
	
	/**
	 * Find the address of a lat lng pair.
	 */
	function codeLatLng(latlng)
	{
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode(
			{'latLng': latlng},
			function(results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					if (results[1])
					{
						var formattedAddress = results[0].formatted_address.split(',');
						$('#address-input').val(formattedAddress[0]);
						$('#address-input').blur();
					}
					else
					{
						alert('We\'re sorry. We could not find an address for this location.');
					}
				}
				else
				{
					alert('We\'re sorry. We could not find an address for this location.');
				}
			}
		);
	}
	
})();