import os

# Defining necessary configuration variables
SECRET_KEY = os.urandom(32)
SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.abspath(os.path.dirname(__file__))}/DB/company.db"
