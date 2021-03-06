
import { error, success } from "../util/toJson";
import marked from "marked";

export default (router) => {
    // 获取文章列表
    router.post("/getArticleList", async (req, res) => {
        // 分页
        const { pageSize, tag, keyword, pageNo } = req.body;
        const offset = (pageNo - 1) * 10;
        const newArr = [];
        try {
            let data = await req.models.article.getList({ offset, pageSize, tag, keyword });
            for (let i = 0; i < data.length; i++) {
                // 获取文章点赞数, 浏览数
                data[i].likes = (await req.models.like.getLikesById(data[i].id)).length;
                data[i].views = (await req.models.view.getViewsById(data[i].id)).length;

                // blog端只接受发布了的文章
                if (!data[i].publish) continue;
                // 解析markdown，去除html标签，传回纯文本，用于文章缩略卡片展示
                const markedContent = marked(data[i].content).replace(/<\/?.+?>/g, "");
                data[i].content = markedContent;
                if (markedContent.length >= 150) {
                    data[i].content = `${markedContent.substring(0, 150)}...`;
                }
                newArr.push(data[i]);
            }
            data = newArr.reverse();
            res.json({ code: "1000", message: "处理成功", data, success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    // 根据id获取文章详情及其评论
    .post("/getArticleById", async (req, res) => {
        const id = req.body.id;
        try {
            const article = (await req.models.article.getArticle(id))[0];
            const commentList = await req.models.comment.getCommentsById(id);
            const likes = (await req.models.like.getLikesById(id)).length;
            const views = (await req.models.view.getViewsById(id)).length;
            article.content = marked(article.content);

            const data = { ...article, commentList, likes, views };
            res.json({ code: "1000", message: "处理成功", data, success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    // admin 获取文章列表
    .post("/admin/getArticleList", async (req, res) => {
        // console.log(req);
        // 分页
        const { pageSize = 10, tag, keyword, pageNo } = req.body;
        const offset = (pageNo - 1) * pageSize;
        try {
            const data = (await req.models.article.getList({ offset, pageSize, tag, keyword })).reverse();
            const total = data.length;
            for (let i = 0; i < data.length; i++) {
                // 获取文章点赞数
                data[i].likes = (await req.models.like.getLikesById(data[i].id)).length;
                data[i].views = (await req.models.view.getViewsById(data[i].id)).length;

                delete data[i].content;
            }
            res.json({ code: "1000", message: "处理成功", data, total, success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    // 根据id获取文章详情及其评论
    .post("/admin/getArticleById", async (req, res) => {
        const { id } = req.body;
        try {
            const article = (await req.models.article.getArticle(id))[0];
            const commentList = await req.models.comment.getCommentsById(id);
            const likes = (await req.models.like.getLikesById(id)).length;
            const views = (await req.models.view.getViewsById(id)).length;

            const data = { ...article, commentList, likes, views };
            res.json({ code: "1000", message: "处理成功", data, success: true });
        } catch (e) {
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    .post("/admin/delArticle", async (req, res) => {
        const id = req.body.id;
        try {
            await req.models.article.delArticle(id);
            res.json({ code: "1000", message: "处理成功", success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    .post("/admin/updateArticle", async (req, res) => {
        try {
            if (!req.body.id) {
                await req.models.article.addArticle(req.body);
            } else {
                await req.models.article.updateArticle(req.body);
            }
            res.json({ code: "1000", message: "处理成功", success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    })
    .post("/admin/publishArticle", async (req, res) => {
        try {
            await req.models.article.updateStatus(req.body);
            res.json({ code: "1000", message: "处理成功", success: true });
        } catch (e) {
            console.log(e);
            res.json({ code: "1001", message: "数据库查询失败", success: false });
        }
    });
};
