
import "./style.css"


const MobilePage = () => {
  return (
    <div>
      <div className="mobileScreen">
        <div className="homeNav">
          <div className="first-row">
            <div className="welcome">
                  <div className="amara">
                  <p>Hello <span>Amara</span></p>
                  </div>
                  <div className="onboard">
                  <p>Welcome Onboard</p>
                  </div>       
            </div>
          
            <div className="layout">
              <p>Great</p>
              <p>Great</p>
              <p>Great</p>
            </div>
          </div>
          
          {/* search box */}
          <div className="search">
            <div className="search-box">
              <div className="icon">
                 <p>ooo</p>
              </div>
              <div className="input">
                <input type="text" placeholder="Who are you looking for?" />
              </div>
            </div>
            <div className="seach-icon-box">
              <p>Greaty</p>
            </div>
          </div>
       </div>
    </div>
    </div>
  )
}

export default MobilePage

