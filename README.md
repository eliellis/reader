## reader is a content extractor for node
### Installation:
`npm install reader`

### Usage:
```javascript
var reader = require('reader');
reader(html, function(text){
    console.log('yo man, you can read this article now', text);
});
```