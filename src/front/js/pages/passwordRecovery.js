import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";

import { Context } from "../store/appContext";
import { useNavigate,useSearchParams } from "react-router-dom";

export const PasswordRecovery = () => {
	const { store, actions } = useContext(Context);
	const [params, setParams]=useSearchParams()
	const navigate=useNavigate()

	console.log(params.get("token"))

	async function submitForm(e){
		e.preventDefault()
		let formData= new FormData(e.target)
		let password=formData.get("password")
		let passwordConfirm=formData.get("passwordConfirm")
		
		if(password== passwordConfirm){
			let baseUrl=process.env.BACKEND_URL
			let resp= await fetch(baseUrl+"/api/changepassword", {
				method: "PATCH",
				headers: {"Content-Type":"application/json", "Authorization":"Bearer "+params.get("token")},
				body: JSON.stringify({password}) 
			})

			if(resp.ok){
				console.log("Clave cambiada")
				navigate("/")
			}
		}else{
			console.log("Claves invalidas")
		}
	}

	return (
		<div className="container">
			<p>Token: {params.get("token") || "No token provided"}</p>

			<form onSubmit={submitForm}>
				<div className="mb-3">
					<label htmlFor="exampleInputEmail1" className="form-label">Password</label>
					<input name="password" type="password" className="form-control" id="exampleInputPassword1"/>
					
				</div>
				<div className="mb-3">
					<label htmlFor="exampleInputPassword1" className="form-label">Confirme Password</label>
					<input name="passwordConfirm" type="password" className="form-control" id="exampleInputPasswordConfirm"/>
					<div id="emailHelp" className="form-text">Confirme su clave.</div>
				</div>
				
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>

		</div>
	);
};