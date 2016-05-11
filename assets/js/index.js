(function() {

function buildStatsPage() {
  $.ajax({
    url: OPENTRIALS_API_URL + '/stats',
    dataType: 'json',
    cache: true,
  }).done(function( data ) {
    $('#trialsCount').html(data.trialsCount);

    $.each(data.trialsPerRegistry, function(i, item) {
      var li = $('<li/>').appendTo('#trialsPerRegistry');
      $('<dt></dt>').text(item.registry+':').appendTo(li);
      $('<dd></dd>').text(item.count).appendTo(li);
    });

    $.each(data.trialsPerYear, function(i, item) {
      var li = $('<li/>').appendTo('#trialsPerYear');
      $('<dt></dt>').text(item.year+':').appendTo(li);
      $('<dd></dd>').text(item.count).appendTo(li);
    });

    $.each(data.topLocations, function(i, item) {
      var li = $('<li/>').appendTo('#topLocation');
      $('<dt></dt>').text(item.name+':').appendTo(li);
      $('<dd></dd>').text(item.count).appendTo(li);
    });

    $.each(data.dateRegistry, function(i, item) {
      var displayDate = (item.updatedate)? new Date(item.updatedate) : '-';
      var li = $('<li/>').appendTo('#updatedRegistry');
      $('<dt></dt>').text(item.name+':').appendTo(li);
      $('<dd></dd>').text(displayDate).appendTo(li);
    });
  });
}

function setupSelect2For(name) {
  var perPage = 10;

  $('select[name="' + name + '"]').select2({
    ajax: {
      url: OPENTRIALS_API_URL + '/search/autocomplete/' + name,
      dataType: 'json',
      delay: 250,
      cache: true,
      data: function(params) {
        return {
          q: params.term,
          page: params.page,
          per_page: perPage,
        };
      },
      processResults: function(data, params) {
        var results = data.items.map(function(d) {
          return {
            id: d.name,
            text: d.name,
          };
        });
        params.page = params.page || 1;

        return {
          results: results,
          pagination: {
            more: (params.page * perPage) < data.total_count,
          },
        };
      },
    },
    tags: true,
  });
}

$(document).ready(function() {
  // mobile menu
  $("#menu").mmenu({
    offCanvas: {
      pageSelector: ".page",
      position: "right",
    },
   }, {
     // configuration
     classNames: {
       selected: "active",
     },
  });

  // home page
  $(".toggle-advanced").click(function() {
    $(".advanced").slideToggle("slow", function() {
      $(".home").toggleClass("advanced-search")
    });
  });

  // clear fieldset button
  $("#clear-fieldset").click(function(ev) {
    var fieldset = $(this).parents('fieldset');
    fieldset.find('input, select, textarea')
      .val('');
    fieldset.find('input:radio, input:checkbox')
      .removeAttr('checked')
      .removeAttr('selected');
  });

  if (window.page == 'stats') {
    buildStatsPage();
  }

  setupSelect2For('problem');
  setupSelect2For('intervention');
  setupSelect2For('person');
  setupSelect2For('organisation');
  setupSelect2For('location');
});

})();
