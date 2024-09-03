import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ClientSelection from './ClientSelection';

const Layout = ({ children, showSelection = false }) => {
    const { toast, logout, auth } = useAuth()
    
    const [showMenu, setShowMenu] = useState(false)
    
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const slidebarArrowRef = useRef(null);
    
    const user_name = auth?.user?.first_name.length > 7 ? `${auth?.user?.first_name.slice(0, 5)}...` : auth?.user?.first_name

    const handleLogout = () => {
        logout()
        navigate("/")
    }

    useEffect(() => {
        const handleToggle = () => {
            if (window.innerWidth > 768) {
                sidebarRef.current.classList.toggle('active');
                contentRef.current.classList.toggle('active');
            } else {
                sidebarRef.current.style.display = sidebarRef.current.style.display === 'none' ? 'block' : 'none';
            }
        };

        const slidebarArrow = slidebarArrowRef.current;
        slidebarArrow.addEventListener('click', handleToggle);

        return () => {
            slidebarArrow.removeEventListener('click', handleToggle);
        };
    }, []);

    return (
        <>
            <Toast ref={toast} />
            <section className="main_header">
                <header>
                    <div className="container">
                        <div className="header_flex">
                            <div className="main_logo">
                                <Link to={"/"}>
                                    <img src="/images/accoutn_logo.svg" alt="" />
                                </Link>
                            </div>
                            <div className="right_head">
                                {
                                    showSelection && (
                                        <ClientSelection className="head_select" />
                                    )
                                }
                                <div className="login_box_top pos_rel">
                                    <button onClick={() => setShowMenu(!showMenu)}>
                                        <img src="/images/login_icn.svg" alt="" />
                                        <span>
                                            {user_name}
                                        </span>
                                        <img className="login_click" src="/images/down_white.svg" alt="" />
                                    </button>
                                    <div className={`login_open ${showMenu ? 'd-block' : 'd-none'}`}>
                                        <button onClick={() => handleLogout()}>Logout</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
            <section className="client_list_section spredsheet">
                <div className="container">
                    <div className="bg_white_box m-20 p-0">
                        <div className="main_part_box wrapper">
                            <div id="sidebar" ref={sidebarRef}>
                                <div className="side_data">
                                    <ul>
                                        <li><Link to={'/user/clients'} className={location.pathname.match("/user/clients") && `selected`}>Home</Link></li>
                                        <li><Link to={'/user/category'} className={location.pathname.match("/user/category") && `selected`}>Category</Link></li>
                                        {/* <li><Link to={'/user/upload-csv'} className={location.pathname.match("/user/upload-csv") && `selected`}>Upload CSV</Link></li> */}
                                        <li><Link >Upload CSV</Link></li>
                                        <li><Link>Chat of accounts</Link></li>
                                        <li><Link>Auto categorize</Link></li>
                                        <li><Link>Check inter-bank transfer</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div id="content" ref={contentRef}>
                                <div className="slidebar_arrow" ref={slidebarArrowRef}><img src="/images/menu.svg" alt="" /></div>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Layout