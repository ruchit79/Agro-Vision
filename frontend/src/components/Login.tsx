import Styles from "./Login.module.css"

export default function Login() {
  return (
    <div className={Styles.container}>
         
        <div className={Styles.formCon}>
            <div className={Styles.header}>
                 <h1 className={Styles.title}>
            <span className={Styles.emoji}>🌱</span>
            AgroVision
          </h1>
          <h5 className={Styles.subHed}>Login into your Account</h5>
            </div>

            <div className={Styles.inputCon}>
                <input type="text" name="" id=""  className={Styles.input} placeholder='Enter gmail'/>
                <input type= "password" name="" id=""  className={Styles.input} placeholder='Enter password'/>
            </div>
            <button className={Styles.btn}>Login</button>
        </div>
    </div>
  )
} 
