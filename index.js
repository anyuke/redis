var redisUtil = require('./redisUtil');

/**
 * 保存redis，并设置过期时间，过期时间为秒
 */
redisUtil.client().setex('key', ExpireTime, 'value', callback);

/**
 * 获取redis
 */
redisUtil.client().get('key', function(err, reply) {
    if (err) {
        logger.error(err);
        return utils.response(res, message.NEED_LOGIN);
    }
    if (!reply || reply != token) {
        return utils.response(res, message.NEED_LOGIN);
    }
    return reply;
});

/**
 * 删除redis
 */
redisUtil.client().del('key');

/**
 * 执行某些操作，例如涉及到金额、抽奖要进行加锁，防止重复操作
 */
redisUtil.setLock('key', 10, function(err, lock) {
    if (err || !lock) {
        logger.error(err);
        return callback(err);
    }

    var sql = "select t.`status`, " +
        " t.amount as payAmount, " +
        " t.channel, " +
        " t.userId as agentId, " +
        " t.os, " +
        " t.channel, " +
        " t2.money as buyAmount, " +
        " t2.present as buyPresent, " +
        " t3.agentId, " +
        " t3.money as accountMoney, " +
        " t4.referrerId " +
        " from tb_recharge_order t  " +
        " left join tb_recharge_ladder t2 " +
        " on t2.id = t.custom " +
        " left join tb_agent_account t3 " +
        " on t3.agentId = t.userId " +
        " left join tb_agent t4 " +
        " on t4.id = t.userId " +
        " where t.orderId = ?";
    mysqlUtil.execute(sql, [orderId], function(err, result) {
        if (err) {
            redisUtil.clearLock(lock); // 操作完后要记得去掉锁
            callback(err);
            return;
        }
        redisUtil.clearLock(lock);	// 操作完后要记得去掉锁
        callback(err);
    });
});

/**
 * redis 队列
 * packet = [1,2,3,4,5]
 */
redisUtil.client().del('USER_SHARE_RED_PACKET', function(err) {
    if (err) {
        logger.error(err);
        return;
    }
    redisUtil.client().lpush('USER_SHARE_RED_PACKET', packet);
});

/**
 * 依次从某个key(数组)里取值，并把这个值从key(数组)里删除掉
 */
redisUtil.client().lpop('USER_SHARE_RED_PACKET', function(err, ret) {
    return ret; // 5
});


/**
 * redis 发布和订阅
 */
const ROOM_END_RESULT = 'ROOM_END_RESULT';

redisUtil.client().subscribe(ROOM_END_RESULT, function(err) {
    if (err) {
        logger.error(err);
        return;
    }
    logger.info('监听队列：', ROOM_END_RESULT);
});

redisUtil.client().on('message', function(channel, message) {
    logger.info('[' + channel + ']', message);
    
    switch (channel) {
        case ROOM_END_RESULT:
            try {
                var obj = JSON.parse(message);
                if (obj) {
                    modules.room.roomManager.onMessage(obj.roomid, obj.creatorid, obj.result);
                }
            } catch (e) {
                logger.error(e);
            }
            break;
        default:
            break;
    }
});


//发布
redisUtil.client().publish(channel, message);