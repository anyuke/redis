var redis = require('redis');
var config = {
    redis: {
        host: '127.0.0.1',
        port: 6379,
        opts: {
            auth_pass: 'JTCF@2017'
        }
    }
};
var redisClient = redis.createClient(config.redis.port, config.redis.host, config.redis.opts);

module.exports = {
    /**
     * 初始化redis
     *
     * @Author   Anyuke
     * @DateTime 2017-09-19
     * @return   redisClient
     */
    client: function() {
        if (redisClient) {
            return redisClient;
        }
        redisClient = redis.createClient(config.redis.port, config.redis.host, config.redis.opts);
        redisClient.on('error', function(err) {
            logger.error(err);
        });
        return redisClient;
    },

    /**
     * 加锁
     *
     * @Author   Anyuke
     * @DateTime 2017-09-19
     * @param    {string}   resource key
     * @param    {number}   ttl      过期时间
     * @param    {Function} callback 回掉函数
     */
    setLock: function(resource, ttl, callback) {
        if (!resource || !ttl || !callback) {
            return callback('缺少参数', null);
        }
        var self = this;
        var value = Date.now() + utils.createRandomStr(16);
        self.client().SET(resource, value, 'EX', ttl, 'NX', function(err, reply) {
            if (!err && reply === 'OK') {
                return callback(null, {resource: resource, value: value});
            }
            err = err || resource + '处于锁定状态';
            return callback(err, null);
        });
    },

    /**
     * 删除锁
     *
     * @Author   Anyuke
     * @DateTime 2017-09-19
     * @param    {object}   lock 对象
     */
    clearLock: function(lock) {
        if (!lock) {
            return;
        }
        var self = this;
        self.client().GET(lock.resource, function(err, reply) {
            if (reply === lock.value) {
                self.client().DEL(lock.resource);
            }
        });
    },

    /**
     * 加锁2
     *
     * @Author   Anyuke
     * @DateTime 2017-09-19
     * @param    {string}   resource key
     * @param    {string}   value    value
     * @param    {number}   ttl      过期时间
     * @param    {Function} callback [description]
     */
    setLock2: function(resource, value, ttl, callback) {
        if (!resource || !ttl || !callback) {
            return callback('缺少参数', null);
        }
        var self = this;
        self.client().SET(resource, value, 'EX', ttl, 'NX', function(err, reply) {
            if (!err && reply === 'OK') {
                return callback(null, {resource: resource, value: value});
            }
            err = err || resource + '处于锁定状态';
            return callback(err, null);
        });
    },

    /**
     * 判断是否处于锁状态
     *
     * @Author   Anyuke
     * @DateTime 2017-09-19
     * @param    {string}   resource key
     * @param    {string}   value    value
     * @param    {Function} callback [description]
     * @return   {Boolean}           true|false
     */
    isLock: function(resource, value, callback) {
        var self = this;
        self.client().GET(resource, function(err, reply) {
            return callback(err, value == reply);
        });
    }
};