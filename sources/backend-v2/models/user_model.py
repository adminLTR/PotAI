from flask import current_app
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash

mysql = MySQL()

class User:
    @staticmethod
    def find_by_username(username):
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        return user

    @staticmethod
    def create(username, email, password):
        password_hash = generate_password_hash(password)
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                    (username, email, password_hash))
        mysql.connection.commit()
        cur.close()

    @staticmethod
    def verify_password(stored_hash, password):
        return check_password_hash(stored_hash, password)

    @staticmethod
    def create_session(user_id, session_token, expires_at):
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                    (user_id, session_token, expires_at))
        mysql.connection.commit()
        cur.close()

    @staticmethod
    def delete_session(user_id, session_token):
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM sessions WHERE user_id = %s AND session_token = %s", (user_id, session_token))
        mysql.connection.commit()
        cur.close()
