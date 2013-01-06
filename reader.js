cheerio = require('cheerio');
async = require('async');

var MAXRANKING = 100;

function fuzzyTestElement(strings){
  var list = [];
  for(var string in strings){
    var tester = new RegExp(strings[string], 'g');
    if(tester.test($(this).attr('class')) || tester.test($(this).attr('id'))){
      list.push(strings[string]);
    }
  }
  return list;
}

function strictTestElement(strings){
  for (var string in strings){
    if($(this).attr('class') === strings[string] || $(this).attr('id') === strings[string]){
      return true;
    }
    else if(string === strings.length)
      return false;
  }
}

/*
  readablity body-text extractor, also we have no idea how big the page you want is, so this is async as hell
*/
module.exports = function(context, finished){
  $ = cheerio.load(context);
  var div_list = [];

  async.forEach($('div'),
    function(item, callback){
      var testEl = fuzzyTestElement.bind(item); //bind the 'this' keyword to the current div
      if (testEl(['body', 'content', 'text', 'article', 'blog', 'post'])){
        div_list.push($(item));
      }
      callback(null);
    },
    function(err){
      //removes extraneouos tags and maps all the items to cheerio objects
      async.map(div_list,
        function(item, callback){
          $(item).find('[class~=image]').remove();
          $(item).find('noscript').remove();
          $(item).find('script').remove();
          $(item).find('iframe').remove();
          $(item).find('[class*=navigat]').remove();
          $(item).find('[class*=comment]').remove();
          $(item).find('[id*=comment]').remove();
          callback(null, item);
        },
        function(err, results){
          async.sortBy(results, //sorts elements by calculated likelyhood that they are actually the content
            function(item, callback){
              var rank = 0;
              var search_tags = ['instapaper_body', 'body', 'content', 'contents,', 'text', 'article', 'blog', 'post', 'main', 'story-body', 'article-body', 'post-body'];

              //someplace, somewhere these words show up in the id or class of the div, and the more the merrier
              rank += MAXRANKING * fuzzyTestElement.call(item, search_tags).length;

              //as sure as we can be that this is the content we're looking for, since this is a strict test, we add more (+75%) to the rank
              if (strictTestElement.call(item, search_tags)){
                rank += (MAXRANKING / 4 * 3);
              }

              var weight = -(rank * item.text().length);
              callback(null, weight); //negative value because we want the largest weighing item at the top
            },
            function(err, results){
              finished((results[0]) ? results[0].text() : undefined);
            });
      });
  });
};
