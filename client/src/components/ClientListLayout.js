import React from 'react'

const ClientListLayout = () => {
    return (
        <>
            <section className="main_header">
                <header>
                    <div className="container">
                        <div className="header_flex">
                            <div className="main_logo">
                                <a href="#"><img src="images/accoutn_logo.svg" alt="" /></a>
                            </div>
                            <div className="login_box_top pos_rel">
                                <a href="#">
                                    <img src="images/login_icn.svg" alt="" />
                                    <span> Login</span>
                                    <img className="login_click" src="images/down_white.svg" alt="" />
                                </a>
                                <div className="login_open">
                                    <a href="#">Logout</a>
                                    <a href="#">Logout</a>
                                    <a href="#">Logout</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
        </>
    )
}

export default ClientListLayout
