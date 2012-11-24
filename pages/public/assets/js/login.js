$(document).ready(function(){
	$("#register-button").click(
		function(){
			$.ajax({
				url: BASE_URL+'/login',
				type: 'POST',
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({email: $("#inputEmail").val(), pass: $("#inputPassword").val()}),
				dataType: 'json',
				complete: function(xhr, textStatus) {
					console.log("hola");
						$.ajax({
		url: BASE_URL+'/subdomains',
		type: 'GET',
		contentType: "application/json; charset=utf-8",
		dataType: 'json',
		complete: function(xhr, textStatus) {
		console.log("hola");
		//called when complete
		}
	});
				//called when complete
				},
				success: function(data, textStatus, xhr) {
				//called when successful
				},
				error: function(xhr, textStatus, errorThrown) {
				//called when there is an error
				}
			});
			return false;
		}
	);
});