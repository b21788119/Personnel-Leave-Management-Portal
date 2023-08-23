from functools import wraps
from flask import session, flash, redirect, url_for


# Decorator function to prevent unauthorized access to the urls.
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "logged_in" in session:
            # If the user is already logged in, returning the function
            return f(*args, **kwargs)
        flash("You have to be logged in to access this page", "danger")
        # If user is not logged in,redirecting to the page of the index function.
        return redirect(url_for('blueprint.index'))

    return decorated_function
