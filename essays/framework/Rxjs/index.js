const { 
  of, tap,
  pipe, interval,

} = rxjs;

const source = of(1, 2, 3, 4, 5);
 
source.pipe(
  tap(n => {
    if (n > 3) {
      throw new TypeError(`Value ${ n } is greater than 3`);
    }
  })
)
.subscribe({ 
  next: console.log, 
  error: err => console.log(err.message) 
});