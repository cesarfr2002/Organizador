const netlifyAuth = {
  isAuthenticated: false,
  user: null,
  
  initialize(callback) {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on("init", user => {
        if (user) {
          this.user = user;
          this.isAuthenticated = true;
        }
        callback(user);
      });
      
      window.netlifyIdentity.on("login", user => {
        this.user = user;
        this.isAuthenticated = true;
        if (callback) callback(user);
      });
      
      window.netlifyIdentity.on("logout", () => {
        this.user = null;
        this.isAuthenticated = false;
        if (callback) callback(null);
      });
    }
  },
  
  authenticate(callback) {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open("login");
      window.netlifyIdentity.on("login", user => {
        this.user = user;
        this.isAuthenticated = true;
        callback(user);
      });
    }
  },
  
  signout(callback) {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.logout();
      this.user = null;
      this.isAuthenticated = false;
      callback();
    }
  }
};

export default netlifyAuth;
