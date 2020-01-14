//youtube API
//charge le lecteur de maniere asynchrome
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//creation du lecteur
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: 'eMotO_iyo-I',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

//appele quand le lecteur est pret
function onPlayerReady(event) {
  event.target.playVideo();
}

//fonction appelee quand l'etat du lecteur change
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    setTimeout(stopVideo, 6000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}




//leaflet API
function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace(
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;
	}
	return vars;
}

var champs_get = $_GET();
var lat = champs_get['latitude']==null?48.9653:champs_get['latitude'];
var lon = champs_get['longitude']==null?2.345:champs_get['longitude'];

var macarte = null;

// Servira à stocker les groupes de marqueurs pour les affichers
var markerClusters;
//tableau contenant les dfferents marker pour pouvoir les supprimer
//var markers = [];
//tableau contenant les dfferents cercles pour pouvoir les supprimer
var circles = [];
//marqueur correspondant au clic sur la map ou au deplacement vers un lieu
var markerUnique = null;


// Fonction d'initialisation de la carte
function initMap() {

	// Nous initialisons les groupes de marqueurs
	markerClusters = L.markerClusterGroup();

	// Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
  macarte = L.map('map', {
		minZoom: 0,
		maxZoom: 20
	});


	// Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
  L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    // Il est toujours bien de laisser le lien vers la source des données
    attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>'
  }).addTo(macarte);

	// Nous ajoutons le groupe de marqueurs a la carte
  macarte.addLayer(markerClusters);

	//on ajoute l'icone unique et les infos sur le lieu
	afficherInfoCoord(lat,lon);

	//on se place a l'endroit souhaite
	macarte.setView([lat, lon], 5);
}




function createQuery(dateDebut,dateFin,minMag,maxMag){
	var q='https://earthquake.usgs.gov/fdsnws/event/1/';
	q +='query?format=geojson&starttime='+dateDebut.toISOString()+'&endtime='+dateFin.toISOString()+'&minmagnitude='+minMag+'&maxmagnitude='+maxMag+'&limit=2000';
	return q;
}


function addCircle(lat, long, mag, date, lieu)
{
	var mycircle= L.circle([lat,long],{
		radius:5000*mag,
		color:"red",
		fillColor:"#f03",
		fillOpacity:0.5
	});
	mycircle.addTo(macarte);
	//on ajoute les cercles aux groupes de marker
	markerClusters.addLayer(mycircle);

	//gestion des informations popup du seisme
	var popup = "<dl><dt>Lieu : </dt>"
           + "<dd>" + lieu + "</dd>"
           + "<dt>Magnitude : </dt>"
           + "<dd>" + mag + "</dd>"
					 + "<dt>Date : </dt>"
           + "<dd>" + date.toLocaleTimeString() + " " + date.toLocaleDateString() + "</dd></dl>";
	mycircle.bindPopup(popup);

	//lorsque l'on clique sur un seisme on affiche les informations du lieu
	mycircle.on('click', function(){
		afficherInfoCoord(lat,long);
	});

	//on ajoute le cercle a la liste des cercles pour pouvoir le supprimer plus tard
	circles.push(mycircle);
};


function addEventMarker(marker, lat, long)
{
	marker.on('click', function(){
		afficherInfoCoord(lat,long);
	});
}


function afficherSeisme(dateDebut, dateFin, deltaTime, time, tableSeisme)
{
	var currentTime = dateDebut.getTime() + time;
	var currentDate = new Date(currentTime);
	var pourcent = Math.round(10*time*100/(dateFin.getTime()-dateDebut.getTime()))/10;
	pourcent.toFixed(1);

	if(tableSeisme.length > 0)
	{
		var taille = tableSeisme.length;
		var newTableSeisme = [];
		var marker;
		var seisme;
		while(tableSeisme.length > 0)
		{
			seisme = tableSeisme.pop();
			//alert("seisme time:"+seisme.time+"  currentTime:"+currentTime);

			if(seisme.time < currentTime)
			{
				//on affiche le seisme
				//marker = L.marker([seisme.lat,seisme.long]);
				//marker.bindPopup(seisme.place);

				//on affiche les infos sur le lieu si on clique sur le marker
				//addEventMarker(marker, seisme.lat, seisme.long);

				// Nous ajoutons le marqueur aux groupes
				//markerClusters.addLayer(marker);
				// Nous ajoutons le marqueur à la liste des marqueurs du groupes pour pouvoir le supprimer plus tard
				//markers.push(marker);

				addCircle(seisme.lat, seisme.long, seisme.mag, seisme.date, seisme.place,);
			}
			else
			{
				//on ajoute le seisme dans le nouveau tableau
				newTableSeisme.push(seisme);
			}
		}
		if(currentTime < dateFin.getTime())
		{
			var htmlOutput = "<div>Date actuelle : "+currentDate.toLocaleTimeString()+" "+currentDate.toLocaleDateString()+"</div>";
			htmlOutput += "<div class=\"progress\">";
			htmlOutput += "<div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow="+pourcent+" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:"+pourcent+"%\">";
	    htmlOutput += pourcent+"%";
			htmlOutput += "</div>";

			document.getElementById("info_simul").innerHTML = htmlOutput;

			setTimeout(function(){
				afficherSeisme(dateDebut, dateFin, deltaTime, time+deltaTime, newTableSeisme);
			},1000);
		}
		else
		{
			var htmlOutput = "<div>Date actuelle : "+dateFin.toLocaleTimeString()+" "+dateFin.toLocaleDateString()+"</div>";
			htmlOutput += "<div class=\"progress\">";
			htmlOutput += "<div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:100%\">";
	    htmlOutput += "100%";
			htmlOutput += "</div>";

			document.getElementById("info_simul").innerHTML = htmlOutput;
		}

	}
	else
	{
		var htmlOutput = "<div>Date actuelle : "+dateFin.toLocaleTimeString()+" "+dateFin.toLocaleDateString()+"</div>";
		htmlOutput += "<div class=\"progress\">";
		htmlOutput += "<div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:100%\">";
		htmlOutput += "100%";
		htmlOutput += "</div>";

		document.getElementById("info_simul").innerHTML = htmlOutput;
	}
}


function recupererSeisme(dateDebut, dateFin, minMag, maxMag, deltaTime)
{
	var queryUrl = createQuery(dateDebut, dateFin, minMag, maxMag);
	$.ajax({
			dataType: "jsonp",
			url: queryUrl,
			cache: true,
			success: function( _data )
			{
				var results = _data.features;
				var taille = results.length;
				var tableSeisme = [];
				for(var i=0 ; i<taille ; i++)
				{
					var seisme = {
					    lat: results[i].geometry.coordinates[1],
					    long: results[i].geometry.coordinates[0],
					    place: results[i].properties.place,
					    mag: results[i].properties.mag,
					    time: results[i].properties.time,
							date: new Date(results[i].properties.time)
					};
					tableSeisme.push(seisme);
				}
				afficherSeisme(dateDebut, dateFin, deltaTime, 0, tableSeisme)
			}
	});
}



function ajouterIconeAvecCoord(lat, long)
{
	var greenIcon = new L.Icon({
	  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	  iconSize: [25, 41],
	  iconAnchor: [12, 41],
	  popupAnchor: [1, -34],
	  shadowSize: [41, 41]
	});

	if(markerUnique != null)
		markerUnique.removeFrom(macarte);
	markerUnique = L.marker([lat, long], {icon: greenIcon});
	markerUnique.bindPopup("("+lat+", "+long+")");
	markerUnique.addTo(macarte);
}



function recupererPersonnalites(country)
{
	document.getElementById('countryName').innerHTML = country;

	//on supprime les accents
	country = country.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

	var url = "http://dbpedia.org/sparql";
	var query = [
		"PREFIX bif: <bif:>",
		"PREFIX dbo: <http://dbpedia.org/ontology/>",
		"PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>",
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
		"select distinct ?name ?bio where {",
			"?cityPage rdfs:label ?country.",
			"?pers dbo:birthPlace ?cityPage;",
						"rdfs:label ?name;",
						"dbo:abstract ?bio.",
			"?country bif:contains \"'"+country+"'\".",
		"FILTER(langMatches(lang(?name),\"FR\") && langMatches(lang(?bio),\"FR\"))",
		"OPTIONAL{?cityPage dbo:populationTotal ?population}",
		"}",
		"ORDER BY DESC (?population)",
		"LIMIT 10"
	].join(" ");

	var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

	$.ajax({
			dataType: "jsonp",
			url: queryUrl,
			success: function( _data ) {
					var results = _data.results.bindings;
					var taille = results.length;
					var infoPeople = "";
					for(var i=0 ; i<taille ; i++)
					{
						infoPeople += "<div><h3>"+results[i].name.value+"</h3>";
						infoPeople += "<div>"+results[i].bio.value+"</div></div>";
					}
					document.getElementById('infoPeople').innerHTML = infoPeople;
			}
	});
}



function afficherInfoCoord(lat, long)
{
	var url = "http://dbpedia.org/sparql";
	var query = [
		"PREFIX dbo: <http://dbpedia.org/ontology/>",
		"PREFIX dbr: <http://dbpedia.org/resource/>",
		"PREFIX dbp: <http://dbpedia.org/property/>",
		"PREFIX foaf: <http://xmlns.com/foaf/0.1/>",
		"PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>",
		"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
		"PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>",
		"SELECT ?cityName ?info ?language ?population ?countryName ?area WHERE {",
		"?city a dbpedia-owl:PopulatedPlace;",
					"rdfs:label ?cityName;",
			 		"geo:lat ?lat;",
			 		"geo:long ?long;",
			 		"dbo:abstract ?info.",
		"BIND("+long+" AS ?longbis).",
		"BIND("+lat+" AS ?latbis).",
		"BIND(lang(?info) AS ?language).",
		"BIND(bif:st_distance(",
			 "bif:st_point(?long,?lat),",
			 "bif:st_point(?longbis,?latbis)",
		")AS ?distance).",
		"FILTER(bif:st_intersects( bif:st_point (?long, ?lat), bif:st_point (?longbis, ?latbis), 10))",
		"OPTIONAL {?city dbo:populationTotal ?population.}",
		"OPTIONAL {?city dbo:country ?country. ?country rdfs:label ?countryName. FILTER(langMatches(lang(?countryName),\"FR\"))}",
		"OPTIONAL {?city dbo:areaTotal ?area.}",
		"OPTIONAL {?city dbo:area ?area.}",
		"}",
		"ORDER BY ?distance"
	].join(" ");
	var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";
	ajouterIconeAvecCoord(lat, long)
	document.getElementById('place').innerHTML = "";
	document.getElementById('infoPlace').innerHTML = "";
	document.getElementById('infoPeople').innerHTML = "";
	document.getElementById('countryName').innerHTML = "";


	$.ajax({
			dataType: "jsonp",
			url: queryUrl,
			success: function( _data ) {
					var results = _data.results.bindings;
					if(typeof results[0] !== 'undefined')
					{
						var city = results[0].cityName.value;
						// var parts = res.split('/');
						// var city = parts.pop() || parts.pop();

						//on recupere le nom de la ville
						document.getElementById('place').innerHTML = city;

						//on recupere des infos sur la ville
						var infoCity = "";
						//on recupere le nombre d'habitant
						if(typeof results[0].population !== 'undefined')
						{
							infoCity += "<h4>Population : "+results[0].population.value+" habitants</h4>";
						}

						//on recupere la superficie
						if(typeof results[0].area !== 'undefined')
						{
							infoCity += "<h4>Superficie : "+results[0].area.value/1000000+"km²</h4>";
						}

						//on ajoute un lien vers une video youtube en relation avec le lieu
						infoCity += "<h4>Vidéo : <a href=\"http://www.youtube.com/embed?listType=search&list="+city+"\" target=\"_blank\"><i class=\"fab fa-youtube\"></i></a></h4>";

						//on recupere la description du lieu
						var infoFinded = 0;
						for(var i in results)
						{
							if(results[i].language.value == "fr")
							{
								infoCity += "<h4>Description : </h4>";
								infoCity += results[i].info.value;
								infoFinded = 1;
								break;
							}
						}
						if(infoFinded == 0)
						{
							for(var i in results)
							{
								if(results[i].language.value == "en")
								{
									infoCity += "<h4>Description : </h4>";
									infoCity += results[i].info.value;
									infoFinded = 1;
									break;
								}
							}
						}

						//on ajoute toues les informations générales sur la Page
						document.getElementById('infoPlace').innerHTML = infoCity;



						//on recupere le pays
						var country;
						if(typeof results[0].countryName !== 'undefined')
						{
							country = results[0].countryName.value;
						}
						else
							country = city;
						recupererPersonnalites(country);
					}
			}
	});

}


function onMapClick(e)
{
	afficherInfoCoord(e.latlng.lat, e.latlng.lng);
}






function formLatLong(e)
{
	e.preventDefault();
	var lat = document.getElementById('formLatitude').value;
	var long = document.getElementById('formLongitude').value;

	//on desactive le panneau lateral
	$('#sidebar').removeClass('active');
	$('.overlay').removeClass('active');

	afficherInfoCoord(lat, long);
	macarte.flyTo([lat,long]);
}




function formCityCountry(e)
{
	e.preventDefault();
	var city = document.getElementById('formCity').value;
	var country = document.getElementById('formCountry').value;

	//on supprime les accents
	city = city.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
	country = country.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

	var url = "http://dbpedia.org/sparql";
	var query;
	if(city != "" && country != "")
	{
		query = [
			"PREFIX bif: <bif:>",
			"PREFIX dbo: <http://dbpedia.org/ontology/>",
			"PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>",
			"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
			"PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>",
			"select distinct ?lat ?long where {",
			  "?cityPage rdfs:label ?city;",
			        "dbo:country ?countryPage;",
			        "geo:lat ?lat;",
			        "geo:long ?long.",
			  "?countryPage rdfs:label ?country.",
			  "?city bif:contains \"'"+city+"'\".",
			  "?country bif:contains \"'"+country+"'\".",
			"OPTIONAL{?cityPage dbo:populationTotal ?population}",
			"}",
			"ORDER BY DESC (?population)",
			"LIMIT 1"
		].join(" ");

		var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

		$.ajax({
				dataType: "jsonp",
				url: queryUrl,
				success: function( _data ) {
						var results = _data.results.bindings;
						var lat = results[0].lat.value;
						var long = results[0].long.value;

						//on desactive le panneau lateral
		        $('#sidebar').removeClass('active');
		        $('.overlay').removeClass('active');

						afficherInfoCoord(lat, long);
						macarte.flyTo([lat,long],12);
				}
		});
	}
	else if(city != "")
	{
		query = [
			"PREFIX bif: <bif:>",
			"PREFIX dbo: <http://dbpedia.org/ontology/>",
			"PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>",
			"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
			"PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>",
			"select distinct ?lat ?long where {",
			  "?cityPage rdfs:label ?city;",
			        "geo:lat ?lat;",
			        "geo:long ?long.",
			  "?city bif:contains \"'"+city+"'\".",
			"OPTIONAL{?cityPage dbo:populationTotal ?population}",
			"}",
			"ORDER BY DESC (?population)",
			"LIMIT 1"
		].join(" ");

		var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

		$.ajax({
				dataType: "jsonp",
				url: queryUrl,
				success: function( _data ) {
						var results = _data.results.bindings;
						var lat = results[0].lat.value;
						var long = results[0].long.value;

						//on desactive le panneau lateral
		        $('#sidebar').removeClass('active');
		        $('.overlay').removeClass('active');

						afficherInfoCoord(lat, long);
						macarte.flyTo([lat,long],12);
				}
		});
	}
	else if(country != "")
	{
		query = [
			"PREFIX bif: <bif:>",
			"PREFIX dbo: <http://dbpedia.org/ontology/>",
			"PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>",
			"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
			"PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>",
			"select distinct ?lat ?long where {",
			  "?cityPage rdfs:label ?country;",
			        "geo:lat ?lat;",
			        "geo:long ?long.",
			  "?country bif:contains \"'"+country+"'\".",
			"OPTIONAL{?cityPage dbo:populationTotal ?population}",
			"}",
			"ORDER BY DESC (?population)",
			"LIMIT 1"
		].join(" ");

		var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

		$.ajax({
				dataType: "jsonp",
				url: queryUrl,
				success: function( _data ) {
						var results = _data.results.bindings;
						var lat = results[0].lat.value;
						var long = results[0].long.value;

						//on desactive le panneau lateral
		        $('#sidebar').removeClass('active');
		        $('.overlay').removeClass('active');

						afficherInfoCoord(lat, long);
						macarte.flyTo([lat,long],5);
				}
		});
	}

}







function formOptionSeisme(e)
{
	e.preventDefault();
	var dateDebut = new Date(document.getElementById('formDateDebutSeisme').value);
	var dateFin = new Date(document.getElementById('formDateFinSeisme').value);

	var minMag = document.getElementById('formMagnitudeMin').value;
	var maxMag = document.getElementById('formMagnitudeMax').value;

	var vitesse = document.getElementById('formValeurVitesse').value;
	var unite = document.getElementById('formUniteVitesse').value;

	var deltaTime = vitesse;
	if(unite == "minutes")
		deltaTime *= 1000*60;
	else if(unite == "heures")
		deltaTime *= 1000*60*60;
	else if(unite == "jours")
		deltaTime *= 1000*60*60*24;
	else if(unite == "mois")
		deltaTime *= 1000*60*60*24*30;
	else if(unite == "annees")
		deltaTime *= 1000*60*60*24*30*365;

	//alert("Debut: "+debut+"\nFin: "+fin+"\nVitesse: "+vitesse+unite+"/sec");

	//on desactive le panneau lateral
	$('#sidebar').removeClass('active');
	$('.overlay').removeClass('active');

	//on supprime les anciens marqueurs
	// while(markers.length >0)
	// {
	// 	var m = markers.pop();
	// 	markerClusters.removeLayer(m);
	// }
	//on supprime les anciens cercles
	while(circles.length >0)
	{
		var c = circles.pop();
		markerClusters.removeLayer(c);
		c.removeFrom(macarte);
	}

	recupererSeisme(dateDebut, dateFin, minMag, maxMag, deltaTime)
}





window.onload = function(){
  // Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
  initMap();
	macarte.on('click', onMapClick);

	document.getElementById('formLatLong').addEventListener('submit', function(e)
		{
			formLatLong(e);
  	});

	document.getElementById('formCityCountry').addEventListener('submit', function(e)
		{
			formCityCountry(e);
  	});

	document.getElementById('formOptionSeisme').addEventListener('submit', function(e)
		{
			formOptionSeisme(e);
  	});
};







//permet de rafraichir les tuiles grises lors du chargement de la map
$("a[href='#menu1']").on('shown.bs.tab', function(e) {
  macarte.invalidateSize();
});
