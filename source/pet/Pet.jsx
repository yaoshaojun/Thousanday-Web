import React, {Component} from "react";
import ReactDOM from "react-dom";
import reqwest from "reqwest";
import Header from "../general/Header";
import Footer from "../general/Footer";
import Waterfall from "../component/Waterfall";
import noGetGender from "../js/noGetGender.js";
import noGetType from "../js/noGetType.js";
import noGetNature from "../js/noGetNature.js";
import processGallery from "../js/processGallery.js";
import processError from "../js/processError.js";
class Pet extends Component {
	constructor(props) {
        super(props);
		this.state = {
            //store user id
            userId: null,
            //store user name
            userName: null,
            //store user token
            userToken: null,
            //store data for one pet
            petData: [],
            //store data for pet's family
            familyData: [],
            //store data for pets friend
            friendData: [],
            //store data for image gallery
            galleryData: [],
            //indicate load how many times
            loader: 1,
            //indicate could load more or not
            locker: false,
            //store all watcher of current pet
            watchData: [],
            //indicate notice user login or not
            logRequire: false
		};
	}
    //get user data if user logged in
    componentWillMount() {
        if (sessionStorage.getItem("id")) {
            let id = sessionStorage.getItem("id");
            let name = sessionStorage.getItem("name");
            let token = sessionStorage.getItem("token");
            this.setState({userId: parseInt(id), userName: name, userToken: token});
        }
    }
    //load pet data
    componentDidMount() {
        reqwest({
            url: "/pet/read?id=" + window.location.pathname.split("/").pop(),
            method: "GET",
            success: function(result) {
                result = JSON.parse(result);
                //get data for images
                let images, locker;
                if (result[3].length === 0) {
                    images = [];
                    locker = true;
                } else if (result[3].length === 20) {
                    images = processGallery(result[3]);
                    locker = false;
                } else {
                    images = processGallery(result[3]);
                    locker = true;
                }
                //get all watcher id
                let watch = [], i;
                for (i = 0; i < result[4].length; i++) {
                    watch[i] = parseInt(result[4][i].user_id);
                }
                this.setState({petData: result[0], familyData: result[1], friendData: result[2], galleryData: images, locker: locker, watchData: watch});
            }.bind(this),
            error: function (err) {
                processError(err);
            }
        });
    }
    watchPet() {
        if (!this.state.userId) {
            this.setState({logRequire: true});
        } else {
            let action;
            if (this.state.watchData.indexOf(this.state.userId) !== -1) {
                action = 0;
            } else {
                action = 1;
            }
            reqwest({
                url: "/pet/watch",
                type: "json",
                contentType: "application/json",
                method: "POST",
                data: JSON.stringify({
                    "token": this.state.userToken,
                    "user": this.state.userId,
                    "action": action,
                    "pet": window.location.pathname.split("/").pop()
                }),
                success: function(result) {
                    if (result === 1) {
                        if (action === 1) {
                            this.state.watchData.push(this.state.userId);
                        } else {
                            this.state.watchData.splice(this.state.watchData.indexOf(this.state.userId), 1);
                        }
                        this.setState({watchData: this.state.watchData});
                    }
                }.bind(this),
                error: function (err) {
                    processError(err);
                }
            });
        }
    }
    loadMore() {
        if (!this.state.locker) {
            reqwest({
                url: "/pet/load?load=" + this.state.loader + "&pet=" + window.location.pathname.split("/").pop(),
                method: "GET",
                success: function(result) {
                    result = JSON.parse(result);
                    let images = processGallery(result);
                    let combine = this.state.galleryData.concat(images);
                    if (result.length === 20) {
                        this.setState({galleryData: combine, loader: this.state.loader + 1});
                    } else {
                        this.setState({galleryData: combine, loader: this.state.loader + 1, locker: true});
                    }
                }.bind(this),
                error: function (err) {
                    processError(err);
                }
            });
        }
    }
	render() {
        //content show in watch pet button
        let watchPet;
        if (this.state.userId && this.state.watchData.indexOf(this.state.userId) !== -1) {
            watchPet = "Watched | by " + this.state.watchData.length;
        } else {
            if (this.state.logRequire) {
                watchPet = "Please Login";
            } else {
                watchPet = "+ Watch | by " + this.state.watchData.length;
            }
        }
        //show all family
        let families = this.state.familyData.map((family, index) =>
            <div key={"petfamily" + index} className="main-owner">
                <a href={"/user/" + family.user_id}>
                    <img src = {"/img/user/" + family.user_id + ".jpg"} />
                    <h5>{family.user_name}</h5>
                </a>
            </div>
        );
        //show all friends
        let friends;
        if (this.state.friendData.length !== 0) {
            friends = this.state.friendData.map((friend, index) =>
                <div key={"petfriend" + index} className="main-friend">
                    <a href={"/pet/" + friend.pet_id}>
                        <img src = {"/img/pet/" + friend.pet_id + "/0.png"}  />
                        <h6>{friend.pet_name}</h6>
                    </a>
                </div>
            );
        }
        //load more button
        let load;
        if (!this.state.locker) {
            load = (
                <h6 id="load-button" onClick={this.loadMore.bind(this)}>
                    Load more ...
                </h6>
            );
        }
		return (
			<div  id="react-root">
                <Header userId={this.state.userId?this.state.userId:null} userName={this.state.userName?this.state.userName:"Login"} />
                <main id="main">
                    <img id="main-profile" alt={this.state.petData.pet_name} src={"/img/pet/" + this.state.petData.pet_id + "/0.png"} />
                    <div id="main-name">
                        <h1>{this.state.petData.pet_name}</h1>
                        <h4>{noGetGender(this.state.petData.pet_gender)}</h4>
                    </div>
                    <h5 id="main-watch" onClick={this.watchPet.bind(this)}>{watchPet}</h5>
                    <h5 id="main-nature">Nature: {noGetNature(this.state.petData.pet_nature)}</h5>
                    <h5 className="main-title">Type: {noGetType(this.state.petData.pet_type)}</h5>
                    <h5 className="main-title">Reg in hub: {this.state.petData.pet_reg?new Date(this.state.petData.pet_reg).toISOString().substring(0, 10):null}</h5>    
                    <div className="main-family">
                        <img alt="Family" src="/img/icon/glyphicons-hub.png" />
                        <h5>Family</h5>
                    </div>
                    {families}
                    <div className="main-family">
                        <img alt="friend" src="/img/icon/glyphicons-team.png" />
                        <h5>Friends</h5>
                    </div>
                    {friends}
                </main>
                <aside id="aside">
                    <div id="aside-title">
                        <img alt="moments" src="/img/icon/glyphicons-moment.png" / >
                        <h4>Moments</h4>
                    </div>
                    <Waterfall column="3" image={this.state.galleryData} fontFamily="'Rubik', sans-serif" />
                    {load}
                </aside>
                <Footer />
			</div>
		);
	}
}

ReactDOM.render(<Pet />, document.getElementById("root"));