import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";

import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";

export const Login = () => {
	const { store, actions } = useContext(Context);
	const navigate=useNavigate()

	async function submitForm(e){
		e.preventDefault()
		let formData= new FormData(e.target)
		let email=formData.get("email")
		let password=formData.get("password")
		console.log(email,password)
		let logged= await actions.login(email,password)
		if(logged) navigate("/")
	}

	return (
		<div className="container">

			<form onSubmit={submitForm}>
				<div className="mb-3">
					<label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
					<input name="email" type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
					<div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
				</div>
				<div className="mb-3">
					<label htmlFor="exampleInputPassword1" className="form-label">Password</label>
					<input name="password" type="password" className="form-control" id="exampleInputPassword1"/>
				</div>
				
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>

		</div>
	);
};