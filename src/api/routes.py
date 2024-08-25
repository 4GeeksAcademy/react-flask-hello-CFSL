"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, TokenBlockedList
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
import os
from flask_bcrypt import Bcrypt
import requests
import json

app = Flask(__name__)
bcrypt = Bcrypt(app)

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

@api.route('/signup', methods=['POST'])
def user_signup():
    body=request.get_json()
    if "email" not in body:
        return jsonify({"msg":"El campo email es requerido"}), 400
    if "password" not in body:
        return jsonify({"msg":"El campo password es requerido"}), 400
    encrypted_password= bcrypt.generate_password_hash(body["password"]).decode('utf-8')
    new_user=User(email=body["email"], password=encrypted_password, is_active=False)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg":"ok"})

@api.route('/login', methods=['POST'])
def user_login():
    body=request.get_json()
    #1. Valido los campos del body de la peticion
    if "email" not in body:
        return jsonify({"msg":"El campo email es requerido"}), 400
    if "password" not in body:
        return jsonify({"msg":"El campo password es requerido"}), 400
    #2. Busca al user en la db con el correo
    user=User.query.filter_by(email=body["email"]).first()
    #2.1 si el user no aparece, retorna error 404
    if user is None:
        return jsonify({"msg":"User no encontrado"}), 404
    #3 verifico el campo password del body con el password del user de la db
    password_checked=bcrypt.check_password_hash(user.password, body["password"])
    #3.1 si no se verifica se retorna un error de clave invalida
    if password_checked == False:
        return jsonify({"msg":"Clave invalida"}), 401

    #Generar el token
    token=create_access_token(identity=user.id, additional_claims={"type":"access"})
    return jsonify({"token":token}),200

@api.route('/userinfo', methods=['GET'])
@jwt_required()
def user_info():
    user=get_jwt_identity()
    return jsonify({"user":user})

@api.route('/logout', methods=['POST'])
@jwt_required()
def user_logout():
    jti=get_jwt()["jti"]
    token_blocked= TokenBlockedList(jti=jti)
    db.session.add(token_blocked)
    db.session.commit()
    return jsonify({"msg":"sesion cerrada"})

#cambio de contraseña con un user autenticado
@api.route("/changepassword", methods=['PATCH'])
@jwt_required()
def user_change_password():
    user_id=get_jwt_identity() #con este user_id tomamos los datos del user
    user=User.query.filter_by(id=user_id).first()
    #si el user no encontrado
    if user is None:
        return jsonify({"msg":"User no encontrado"}), 404

    body=request.get_json()
    new_password=bcrypt.generate_password_hash(body["password"]).decode('utf-8')
    #nueva password encriptada, actualizamos la db
    user.password=new_password
    db.session.add(user)
    if get_jwt()["type"]=="password":
        jti=get_jwt()["jti"]
        token_blocked= TokenBlockedList(jti=jti)
        db.session.flush()
        db.session.add(token_blocked)
    db.session.commit()
    return jsonify ({"msg":"clave actualizada"})


#solicitar recuperación de contraseña
@api.route("/requestpasswordrecovery", methods=['POST'])
def request_password_recovery():
    #buscamos el correo del user
    email=request.get_json()['email']
    user=User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"msg":"User no encontrado"}), 404
    
    #generamos una pequeña sesion del user
    password_token=create_access_token(identity=user.id, additional_claims={"type":"password"})
    url=os.getenv("FRONTENT_URL")
    url=url+"/changepassword?token="+password_token
    #aqui debe enviarse el token en una url para su uso en el frontend
    ####ENVIO DE CORREO
    # service_id= os.getenv("MAIL_SERVICE_ID")
    # template_id= os.getenv("MAIL_TEMPLATE_ID")
    # user_id=os.getenv("MAIL_USER_ID")
    # send_mail_url=os.getenv("MAIL_SEND_URL")
  
    # Datos a enviar
    data = {
        'service_id': os.getenv('MAIL_SERVICE_ID'),
        'template_id': os.getenv('MAIL_TEMPLATE_ID'),
        'user_id': os.getenv('MAIL_USER_ID'),
        'template_params': {'url': url}
    }
    print(data)

    # Encabezados
    headers = {'Content-Type': 'application/json' }
    send_mail_url = os.getenv('MAIL_SEND_URL')

    # Realizar la solicitud POST
    response = requests.post(send_mail_url, data=json.dumps(data), headers=headers)
    
    print(response.text)
    print(url)
    if response.status_code == 200:
        return jsonify({"msg": "Revise su correo para el cambio de contraseña"})
    else:
        return jsonify({"msg": "Ocurrio un error con el envio de correo"}), 400