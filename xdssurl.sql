DROP TABLE xdssurl; -- 删除已有的表

CREATE TABLE xdssurl(
    sid serial NOT NULL PRIMARY KEY,
    url text NOT NULL,
    UNIQUE (url)
) WITH (
    OIDS=FALSE
);

-- 构建基本数据，用于测试以及保证用例有效
INSERT INTO xdssurl(url) VALUES('http://www.gov.cn/'); 
INSERT INTO xdssurl(url) VALUES('http://www.qq.com.cn/'); 
INSERT INTO xdssurl(url) VALUES('http://www.suc.edu.cn/'); 
INSERT INTO xdssurl(url) VALUES('http://freecodecamp.com/news'); 