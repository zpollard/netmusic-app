var bsurl = require('../../../utils/bsurl.js');
var async = require("../../../utils/async.js")
var app = getApp();
Page({
    data: {
        rec: {
            idx: 0, loading: false,
        },
        banner: [4],
        thisday: (new Date()).getDate(),
        cateisShow: false,
        playlist: {
            idx: 1, loading: false,
            list: {},
            offset: 0,
            limit: 20
        },
        catelist: {
            res: {},
            checked: {}
        },
        djlist: {
            idx: 2, loading: false,
            list: [],
            offset: 0,
            limit: 20
        },
        djcate: {loading:false},
        djrecs: {},
        sort: {
            idx: 3, loading: false
        },
        tabidx: 0
    },
    onLoad: function () {
        var that = this
        var rec = this.data.rec
        //banner，
        wx.request({
            url: bsurl + 'banner',
            data: { cookie: app.globalData.cookie },
            success: function (res) {
                that.setData({
                    banner: res.data.banners
                })
            }
        });
        wx.request({
            url: bsurl + 'playlist/catlist',
            complete: function (res) {
                that.setData({
                    catelist: {
                        isShow: false,
                        res: res.data,
                        checked: res.data.all
                    }
                })
            }
        })
        //个性推荐内容,歌单，新歌，mv，电台
        async.map(['personalized', 'personalized/newsong', 'personalized/mv', 'personalized/djprogram'], function (item, callback) {
            wx.request({
                url: bsurl + item,
                data: { cookie: app.globalData.cookie },
                success: function (res) {
                    callback(null, res.data.result)
                }
            })
        }, function (err, results) {
            console.log(err)
            rec.loading = true;
            rec.re = results
            that.setData({
                rec: rec
            })
        });
    },
    switchtab: function (e) {
        var that = this;
        var t = e.currentTarget.dataset.t;
        this.setData({ tabidx: t });
        if (t == 1 && !this.data.playlist.loading) {
            this.gplaylist()
        }
        if (t == 2&&!this.data.djcate.loading) {
            //批量获取电台分类，推荐节目，精选电台，热门电台
            async.map(['djradio/catelist', 'program/recommend', 'djradio/recommend', 'djradio/hot'], function (item, callback) {
                wx.request({
                    url: bsurl + item,
                    data: { cookie: app.globalData.cookie },
                    success: function (res) {
                        callback(null, res.data)
                    }
                })
            }, function (err, results) {
                console.log(err)
                console.log(results)
                var catelist=results[0];
                catelist.loading=true;
                that.setData({
                    djcate:catelist,
                    djrecs:{
                        rec_p:results[1],
                        rec_d:results[2]
                    },
                    djlist:{
                        loading:true,
                        idx:2,
                        list:results[3],
                        limit:20,
                        offset:results[3].djRadios.length
                    }
                })
            });
        }
        if (t == 3 && !this.data.sort.loading) {
            this.data.sort.loading = false;
            this.setData({
                sort: this.data.sort
            })
            wx.request({
                url: bsurl + 'toplist/detail',
                success: function (res) {
                    res.data.idx = 3;
                    res.data.loading = true;
                    that.setData({
                        sort: res.data
                    })
                }
            })
        }

    },
    gdjlist:function(isadd){
        var that=this;
    },
    gplaylist: function (isadd) {
        //分类歌单列表
        var that = this;
        wx.request({
            url: bsurl + 'top/playlist',
            data: {
                limit: that.data.playlist.limit,
                offset: that.data.playlist.offset,
                type: that.data.catelist.checked.name
            },
            complete: function (res) {
                that.data.playlist.loading = true;
                if (!isadd) {
                    that.data.playlist.list = res.data
                } else {
                    res.data.playlists = that.data.playlist.list.playlists.concat(res.data.playlists);
                    that.data.playlist.list = res.data
                }
                that.data.playlist.offset += res.data.playlists.length;
                that.setData({
                    playlist: that.data.playlist
                })
            }
        })
    },
    loadmore: function () {
        if (this.data.tabidx == 1) {
            this.gplaylist(1);//更多歌单
        }
        else if(this.data.tabidx == 2) {
            this.gdjlist(1);//更多dj节目
        }
    },
    togglePtype: function () {
        this.setData({
            cateisShow: !this.data.cateisShow
        })
    },
    cateselect: function (e) {
        var t = e.currentTarget.dataset.catype;
        this.data.catelist.checked = t
        this.setData({
            playlist: {
                idx: 1,
                loading: false,
                list: {},
                offset: 0,
                limit: 20
            },
            cateisShow: !this.data.cateisShow,
            catelist: this.data.catelist
        });
        this.gplaylist();
    },
    onShow: function () {
        if (wx.getStorageSync('cookie') == '') {
            wx.redirectTo({
                url: '../login/index'
            });
            return;
        }
    }
})