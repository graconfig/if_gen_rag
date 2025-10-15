const cds = require("@sap/cds");
const { INSERT, DELETE, SELECT } = cds.ql;
// const fs = require("fs");
const crypto = require("crypto");

module.exports = cds.service.impl(async function () {
  const db = await cds.connect.to("db");
  const {
    Files,
    Knowledges,
    BusinessScenarios,
    CDSViews, 
    CDSViewFiles,
    Viewfields,
  } = db.entities;
  const modelName = "SAP_NEB.20240715"; // 替换为实际模型名称

  this.before("CREATE", "Files", async (req) => {
    const jsonData = JSON.parse(req.req._raw);
    req.data.size = jsonData.size;
  });

  this.on("storeEmbeddings", async (req) => {
    try {
      let textEmbeddingEntries = [];
      const selectRows = req.params.length;
      if (selectRows > 0) {
        const selectID = req.params[0];
        const uploadFile = await SELECT.from(Files).where({ ID: selectID });
        const fileName = uploadFile[0].fileName;
        const fileCategory = uploadFile[0].category;

        // 根据文件名判断语言
        let langu = "";
        if (fileName.includes("EN")) {
          langu = "en";
        } else if (fileName.includes("ZH")) {
          langu = "zh";
        } else if (fileName.includes("JA")) {
          langu = "ja";
        } else {
          langu = "en";
        }

        const [fileContent] = await SELECT("fileContent")
          .from(Files)
          .where({ ID: selectID });

        if (fileContent) {
          const docBuffer = [];

          fileContent.fileContent.on("data", (chunk) => {
            docBuffer.push(chunk);
          });

          await new Promise((resolve, reject) => {
            fileContent.fileContent.on("end", () => {
              resolve();
            });

            fileContent.fileContent.on("error", (err) => {
              reject(err);
            });
          });

          if (docBuffer) {
            //transfer buffer to document
            const docContent = Buffer.concat(docBuffer).toString("utf8");

            //split doucment by \r\n
            const textChunks = docContent.split(/\r\n|\r|\n/);

            //generate vecotr each line
            for (const chunk of textChunks) {
              const cdsInfo = chunk.split(",");
              //去掉双引号
              const tableName = cdsInfo[0] ? cdsInfo[0].replace(/"/g, "") : "";
              const tableDesc = cdsInfo[1] ? cdsInfo[1].replace(/"/g, "") : "";
              const entry = {
                ID: crypto.randomUUID(),
                file_ID: selectID,
                category: fileCategory,
                content: chunk,
                tableName: tableName,
                tableDesc: tableDesc,
                langu: langu,
              };

              textEmbeddingEntries.push(entry);
            }

            // Update vector text into db
            if (textEmbeddingEntries) {
              //Delete exists knowledges before upsert
              await DELETE.from(Knowledges).where({ file_ID: selectID });
              await UPDATE.entity(Files, selectID).set({
                isGenerated: false,
              });

              //UPSERT Knowledges
              const updateStatus = await INSERT.into(Knowledges).entries(
                textEmbeddingEntries
              );
              if (!updateStatus) {
                throw new Error("Update of vector text into db failed!");
              } else {
                //Update File isGenerated
                const fileGenerated = await UPDATE.entity(Files, selectID).set({
                  isGenerated: true,
                });
                if (!fileGenerated) {
                  throw new Error("File update failed!");
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Handle any errors that occur during the execution
      console.log(
        "Error while generating and storing vector embeddings:",
        error
      );
      throw error;
    }

    return "Embeddings generate successfully!";
  });

  this.on("deleteEmbeddings", async (req) => {
    try {
      // Delete any previous records in the table
      const uuid = req.params[0];
      const { Files, Knowledges, CDSViewFiles, Viewfields } = this.entities;

      await DELETE.from(Knowledges).where({ file_ID: uuid });
      await UPDATE.entity(Files, uuid).set({
        isGenerated: false,
      });

      await DELETE.from(Viewfields).where({ file_ID: uuid });
      await UPDATE.entity(CDSViewFiles, uuid).set({
        isGenerated: false,
      });
      return "Success!";
    } catch (error) {
      // Handle any errors that occur during the execution
      console.log("Error while deleting the embeddings content in db:", error);
      throw error;
    }
  });

  this.on("similitarySearch", async (req) => {
    const { question, category, top, threshold } = req.data;

    const tableName = Knowledges.name.toLocaleUpperCase().replaceAll(".", "_");

    const sqlString = `SELECT TOP ${top} ID,CAST(CONTENT AS CHAR) as CONTENT,CATEGORY 
            FROM "${tableName}" 
            WHERE COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) > ${threshold}
             AND CATEGORY = '${category}'
            ORDER BY COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) DESC `;

    console.log(sqlString);

    return await db.run(sqlString);
  });

  this.on("tableFieldsSearch", async (req) => {
    const { question, top, threshold, langu } = req.data;

    const tableName = Knowledges.name.toLocaleUpperCase().replaceAll(".", "_");

    const sqlString = `SELECT TOP ${top} ID,CAST(CONTENT AS CHAR) as CONTENT 
            FROM "${tableName}" 
            WHERE COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) > ${threshold}
            AND LANGU = '${langu}'
            ORDER BY COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) DESC `;

    console.log(sqlString);

    return await db.run(sqlString);
  });

  this.on("PUT", "excelupload", async (req, next) => {
    if (req.data.excel) {
      var entity = req.headers.slug;
      const { PassThrough } = require("stream");
      // 创建一个 PassThrough 流作为中间层
      const stream = new PassThrough();
      var buffers = [];
      req.data.excel.pipe(stream);
      await new Promise((resolve, reject) => {
        stream.on("data", (dataChunk) => {
          buffers.push(dataChunk);
        });
        stream.on("end", async () => {
          var buffer = Buffer.concat(buffers);
          var XLSX = require("xlsx");
          //excel读取
          var workbook = XLSX.read(buffer, {
            type: "buffer",
            cellText: true,
            cellDates: true,
            dateNF: 'dd"."mm"."yyyy',
            cellNF: true,
            rawNumbers: false,
          });
          let data = [];
          //获取excel sheet信息
          const sheets = workbook.SheetNames;
          //遍历每个sheet处理数据
          for (let i = 0; i < sheets.length; i++) {
            //文件内容转换成json
            const temp = XLSX.utils.sheet_to_json(
              workbook.Sheets[workbook.SheetNames[i]],
              {
                cellText: true,
                cellDates: true,
                dateNF: 'dd"."mm"."yyyy',
                rawNumbers: false,
              }
            );
            temp.forEach((res, index) => {
              //if (index === 0) return;
              //每行数据push
              data.push(JSON.parse(JSON.stringify(res)));
            });
          }
          if (data) {
            //更新entity
            const responseCall = await CallEntity(entity, data);
            if (responseCall == -1)
              //读取失败
              reject(req.error(400, JSON.stringify(data)));
            else {
              //读取成功
              resolve(
                req.notify({
                  message: "Upload Successful",
                  status: 200,
                })
              );
            }
          }
        });
      });
    } else {
      return next();
    }
  });

  this.on("cdsViewsSearch", async (req) => {
    const { question, threshold, langu } = req.data;

    const tableName = BusinessScenarios.name
      .toLocaleUpperCase()
      .replaceAll(".", "_");

    // Escape single quotes in question by replacing ' with ''
    const escapedQuestion = question.replace(/'/g, "''");

    const sqlString = `SELECT CAST( VIEWCATEGORY AS CHAR) as VIEWCATEGORY 
            FROM "${tableName}" 
            WHERE COSINE_SIMILARITY(VECTOR_EMBEDDING('${escapedQuestion}','QUERY','${modelName}'),EMBEDDINGS) > ${threshold}
            AND LANGUAGE = '${langu}'
            ORDER BY COSINE_SIMILARITY(VECTOR_EMBEDDING('${escapedQuestion}','QUERY','${modelName}'),EMBEDDINGS) DESC `;

    console.log(sqlString);

    const viewCategories = await db.run(sqlString);

    let flatCategories = [];
    for (const viewCategory of viewCategories) {
      const cateArray = viewCategory.VIEWCATEGORY.split("/");
      flatCategories = flatCategories.concat(cateArray);
    }

    console.log(flatCategories);

    if (flatCategories.length > 0) {
      return await SELECT.from(CDSViews)
        .columns(["viewName", "viewDesc", "viewCategory", "isActive"])
        .where({ viewCategory: { in: flatCategories }, isActive: true });
    }
  });

  async function CallEntity(entity, data) {
    if (entity === "CDSViews") {
      //If any custom handling required for a particular entity
    }

    //插入数据
    const insertResult = INSERT.into(CDSViews).entries(data);

    return insertResult; //returns response to excel upload entity
  }

  this.on("generateEmbeddings", async (req) => {
    try {
      let textEmbeddingEntries = [];
      const selectRows = req.params.length;
      if (selectRows > 0) {
        const selectID = req.params[0];
        const uploadFile = await SELECT.from(CDSViewFiles).where({
          ID: selectID,
        });
        const fileName = uploadFile[0].fileName;
        const fileCategory = uploadFile[0].category;

        // 根据文件名判断语言
        let langu = "";
        if (fileName.includes("EN")) {
          langu = "en";
        } else if (fileName.includes("ZH")) {
          langu = "zh";
        } else if (fileName.includes("JA")) {
          langu = "ja";
        } else {
          langu = "en";
        }

        const [fileContent] = await SELECT("fileContent")
          .from(CDSViewFiles)
          .where({ ID: selectID });

        if (fileContent) {
          const docBuffer = [];

          fileContent.fileContent.on("data", (chunk) => {
            docBuffer.push(chunk);
          });

          await new Promise((resolve, reject) => {
            fileContent.fileContent.on("end", () => {
              resolve();
            });

            fileContent.fileContent.on("error", (err) => {
              reject(err);
            });
          });

          if (docBuffer) {
            //transfer buffer to document
            const docContent = Buffer.concat(docBuffer).toString("utf8");

            //split doucment by \r\n
            const textChunks = docContent.split(/\r\n|\r|\n/);

            //generate vecotr each line
            for (const chunk of textChunks) {
              const cdsInfo = chunk.split(",");
              //去掉双引号
              const tableName = cdsInfo[0] ? cdsInfo[0].replace(/"/g, "") : "";
              const tableDesc = cdsInfo[1] ? cdsInfo[1].replace(/"/g, "") : "";
              const entry = {
                ID: crypto.randomUUID(),
                file_ID: selectID,
                category: fileCategory,
                content: chunk,
                tableName: tableName,
                tableDesc: tableDesc,
                langu: langu,
              };

              textEmbeddingEntries.push(entry);
            }

            // Update vector text into db
            if (textEmbeddingEntries) {
              //Delete exists knowledges before upsert
              await DELETE.from(Viewfields).where({ file_ID: selectID });
              await UPDATE.entity(CDSViewFiles, selectID).set({
                isGenerated: false,
              });

              //UPSERT Knowledges
              const updateStatus = await INSERT.into(Viewfields).entries(
                textEmbeddingEntries
              );
              if (!updateStatus) {
                throw new Error("Update of vector text into db failed!");
              } else {
                //Update File isGenerated
                const fileGenerated = await UPDATE.entity(
                  CDSViewFiles,
                  selectID
                ).set({
                  isGenerated: true,
                });
                if (!fileGenerated) {
                  throw new Error("File update failed!");
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Handle any errors that occur during the execution
      console.log(
        "Error while generating and storing vector embeddings:",
        error
      );
      throw error;
    }

    return "Embeddings generate successfully!";
  });

  this.on("viewFieldsSearch", async (req) => {
    const { question, threshold, langu } = req.data;

    const tableName = Viewfields.name.toLocaleUpperCase().replaceAll(".", "_");

    const sqlString = `SELECT ID,CAST(CONTENT AS CHAR) as CONTENT 
            FROM "${tableName}" 
            WHERE COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) > ${threshold}
            AND LANGU = '${langu}'
            ORDER BY COSINE_SIMILARITY(VECTOR_EMBEDDING('${question}','QUERY','${modelName}'),EMBEDDINGS) DESC `;

    console.log(sqlString);

    return await db.run(sqlString);
  });
});
