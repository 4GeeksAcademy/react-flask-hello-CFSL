const apiURL=process.env.BACKEND_URL + "/api"
const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			message: null,
			demo: [
				{
					title: "FIRST",
					background: "white",
					initial: "white"
				},
				{
					title: "SECOND",
					background: "white",
					initial: "white"
				}
			],
			token: null,
			userInfo: null
		},
		actions: {
			// Use getActions to call a function within a fuction
			exampleFunction: () => {
				getActions().changeColor(0, "green");
			},

			getMessage: async () => {
				try{
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello")
					const data = await resp.json()
					setStore({ message: data.message })
					// don't forget to return something, that is how the async resolves
					return data;
				}catch(error){
					console.log("Error loading message from backend", error)
				}
			},
			changeColor: (index, color) => {
				//get the store
				const store = getStore();

				//we have to loop the entire demo array to look for the respective index
				//and change its color
				const demo = store.demo.map((elm, i) => {
					if (i === index) elm.background = color;
					return elm;
				});

				//reset the global store
				setStore({ demo: demo });
			},
			login: async (email, password) => {
				const resp= await fetch(apiURL + "/login" , {
					method:"POST",
					body: JSON.stringify({email,password}),
					headers:{
						"Content-Type":"application/json"
					}
				});
				//la respuesta del back va a traer un token, hay que validar:
				if (!resp.ok){
					setStore({token:null})
					return false
				}
				const data= await resp.json()
				setStore({token: data.token})
				localStorage.setItem("token", data.token)
				return true
				
					
			}, 
			loadSession: async()=>{
				//verificar si tengo el token en el storge
				let storageToken=localStorage.getItem("token")
				if(!storageToken) return
				setStore({token:storageToken})
				let resp= await fetch(apiURL+"/userinfo", {
					headers: {
						"Authorization": "Bearer " + storageToken
					}
				})
				if(!resp.ok){
					setStore({token:null})
					localStorage.removeItem("token")
					return false
				}
				let data= await resp.json()
				setStore({userInfo:data})
			},
			logout: async()=>{
				let {token}= getStore()
				let resp= await fetch(apiURL+"/logout", {
					method:"POST",
					headers: {
						"Authorization": "Bearer " + token
					}
				})
				if(!resp.ok) return false

				setStore({token:null, userInfo:null})
				localStorage.removeItem("token")
				return true
				

			}
		}
	};
};

export default getState;