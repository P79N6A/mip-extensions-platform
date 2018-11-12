/**
 * @file mip-cy-follow-doctor 组件
 * @author
 */

define(function (require) {
    'use strict';

    var customElement = require('customElement').create();
    require('./initJs');
    var $ = require('zepto');

    customElement.prototype.build = function () {
        var $ele = $(this.element);
        var $wrap = $ele.closest('body');
        var toast = require('./toast');
        var auto = $ele.attr('auto') || 0;
        var doctorId = $ele.attr('doctor-id') || '';
        var $dialogTxt = $('.j-follow-dialog-txt');
        var $dialogWxcode = $('.j-follow-dialog-wxcode');

        // 关注或取消关注医生
        if (auto !== '0') {
            followDoctor();
        }

        $ele.on('click', function () {
            if ($ele.hasClass('disabled')) {
                return;
            }
            $ele.addClass('disabled');
            $wrap.find('.tip-pop').hide();
            followDoctor();
        });

        $wrap.on('click', '.close-btn', function () {
            $wrap.find('.attention-tip').addClass('hide');
        });
        $wrap.on('click', '.tip-pop-x', function (e) {
            $wrap.find('.tip-pop').hide();
        });

        function followDoctor() {
            $.ajax({
                url: 'https://m.chunyuyisheng.com/mip/follow_doctor/',
                type: 'post',
                cache: false,
                data: {
                    'doctor_id': doctorId
                },
                dataType: 'json',
                success: function (json) {
                    if (json.status) {
                        $ele.removeClass('disabled');
                        if (json.login_url) {
                            // location.href = json.login_url;
                            $dialogWxcode.attr('src', json.qr_img || 'https://static.chunyuyisheng.com/@/media/images/2018/01/17/_inedx');
                            $dialogTxt.text('扫码关注医生：截图或保存下方二维码图片至手机相册 > 打开微信扫一扫 > 点击右上角“相册” > 选择本图片。');
                            $wrap.find('.attention-tip').removeClass('hide');
                        }
                        else {
                            toast(json.msg);
                        }
                        return;
                    }
                    // 取消关注
                    if ($ele.hasClass('mip-cy-followed-doctor')) {
                        $ele.removeClass('disabled');
                        $ele.removeClass('mip-cy-followed-doctor');
                        $ele.addClass('mip-cy-follow-doctor');
                        return;
                    }
                    // 关注
                    $ele.removeClass('mip-cy-follow-doctor');
                    $ele.addClass('mip-cy-followed-doctor');
                    xzSubscribe();

                    var doctorName = $dialogTxt.data('doctor-name');
                    if (json.coupon_rate > 0) {
                        //  有折扣
                        $dialogTxt.text('您已成功关注' + doctorName + '医生，医生赠送了一张问诊优惠券给您，咨询可享' + json.coupon_rate * 10
                            + '折优惠，为防止失效，请尽快使用微信扫描下方二维码领取（截图或长按图片保存二维码）。');
                    } else {
                        // 无折扣
                        $dialogTxt.text('您已成功关注' + doctorName + '医生，请微信扫描下方二维码添加医生至微信，方便之后随时咨询（截图或长按图片保存二维码）。');
                    }

                    // 医生二维码or折扣二维码
                    $dialogWxcode.attr('src', json.qr_img || 'https://static.chunyuyisheng.com/@/media/images/2018/01/17/_inedx');
                },
                error: function () {
                    $ele.removeClass('disabled');
                    toast('操作失败，请稍后重试!');
                }
            });
        }

        // 百度熊掌号js-sdk提供的关注功能
        function xzSubscribe() {
            if (window.cambrian) {
                var subscribe = window.cambrian.subscribe;
                var isSubscribe = window.cambrian.isSubscribe;

                if (!subscribe && !isSubscribe) { // 获取熊掌号失败
                    $ele.removeClass('disabled');
                    return;
                }
                // 是否已关注熊掌号
                isSubscribe({
                    success: function (res) { // result：true-已关注 false-未关注
                        // 已关注熊掌号提示关注医生成功
                        if (res.result) {
                            $ele.removeClass('disabled');
                            $wrap.find('.attention-tip').removeClass('hide');
                            return;
                        }
                        // 未关注熊掌号，调取熊掌号关注
                        subscribe({
                            data: {
                                type: 'force', // 类型，optional-弱关注 force-强关注
                                title: '确认关注？', // 标题文字，字数限制：4-6个字
                                describe: '将同时关注春雨医生熊掌号，方便您随时向医生咨询。', // 关注说明，字数限制：0-20个字
                                button: '确认' // 按钮文字，字数限制：2-6个字
                            },
                            complete: function (res) { // status 0-未关注 1-新增关注 2-已关注
                                $ele.removeClass('disabled');
                                $wrap.find('.attention-tip').removeClass('hide');
                                if (!res.status) {
                                    $.ajax({
                                        url: 'https://m.chunyuyisheng.com/stat/h5/event_analyse/data_upload/',
                                        type: 'post',
                                        data: {
                                            events: JSON.stringify([{
                                                key: 'XZHDoctorNewfans',
                                                segmentation: {
                                                    result: res.result
                                                }
                                            }])
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else {
                setTimeout(xzSubscribe, 100);
            }
        }
    };

    return customElement;
});
