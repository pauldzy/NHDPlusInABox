from flask import Flask;

app = Flask(__name__);

###############################################################################
## Routes
############################################################################### 
@app.route("/")
def index():
   return "<h1>NHDPlus In A Box</h1>" \
        + "<a href='/static/quick_setup.html'>Quick setup instructions</a>";
   
###############################################################################
##
###############################################################################
def start():
   app.run(debug=True);
   
if __name__ == "__main__":
   app.run(debug=True);

