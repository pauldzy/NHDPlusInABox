from flask import Flask;

app = Flask(__name__);

###############################################################################
## Routes
############################################################################### 
@app.route("/")
def index():
   return "<h1 style='color:blue'>Flask is up and running.</h1>";
   
###############################################################################
##
###############################################################################
def start():
   app.run(debug=True);
   
if __name__ == "__main__":
   app.run(debug=True);
