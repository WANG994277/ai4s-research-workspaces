"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useResearch } from "./store";
import { assetTypes, scoped } from "./seed";
import { now, uid, writable } from "./domain";
import { Alert, Button, Details, Modal } from "./ui";
import type { AssetType } from "./types";
/** Preview the external return contract. A production callback must be signed and verified on the server. */
export function ExternalReturn() {
  const query = useSearchParams();
  const router = useRouter();
  const { s, p, space, mutate } = useResearch();
  const [error, setError] = useState("");
  const externalId = query.get("external_object_id");
  const name = query.get("name") ?? "";
  const type = query.get("asset_type") as AssetType;
  const version = query.get("version") ?? "V1.0";
  const close = () => router.replace("/assets");
  if (!externalId) return null;
  const existing = s.assets.find((a) => a.externalId === externalId);
  return (
    <Modal
      title="AI 中台创建结果回流"
      open
      onClose={close}
      footer={
        <>
          <Button onClick={close}>返回</Button>
          <Button
            primary
            disabled={!!existing}
            onClick={() => {
              if (!name.trim() || !assetTypes.includes(type)) {
                setError("回流数据缺少有效的名称或资产类型。");
                return;
              }
              if (
                mutate("已登记回流资产", externalId, (d, u) => {
                  if (!writable(d, u, space.id))
                    throw new Error("当前空间不可登记资产。");
                  if (
                    query.get("space_id") &&
                    query.get("space_id") !== space.id
                  )
                    throw new Error(
                      "返回空间与当前空间不一致，请切换至来源空间。",
                    );
                  if (d.assets.some((a) => a.externalId === externalId))
                    throw new Error("该外部对象已登记。");
                  const id = uid("asset");
                  d.assets.unshift({
                    ...scoped(id, name, space.id, "PRIVATE", u.id),
                    projectId: space.projectId,
                    type,
                    discipline: "其他",
                    description: "AI 中台创建对象回流，待补全使用说明。",
                    source: "AI 中台",
                    externalId,
                    version,
                    versions: [
                      {
                        id: uid("version"),
                        number: version,
                        description: "AI 中台创建结果",
                        at: now(),
                        by: u.id,
                        status: "有效",
                      },
                    ],
                    publishStatus: "未发布",
                    lifecycle: "有效",
                    availability: "暂不可用",
                    provider: u.name,
                    tags: [],
                    input: "",
                    output: "",
                    limitations: "调用配置尚未同步。",
                    validation: "待验证",
                    dependencies: [],
                    schema: [],
                  });
                })
              )
                close();
            }}
          >
            登记到我的资产
          </Button>
        </>
      }
    >
      <Details
        values={{
          名称: name,
          类型: type,
          版本: version,
          外部对象: externalId,
          当前用户: p.name,
          空间: space.name,
          登记状态: existing ? "已登记" : "待登记",
        }}
      />
      <Alert>本地原型仅预览回流数据；正式接入需由服务端验证来源与签名。</Alert>
      {error && <Alert>{error}</Alert>}
    </Modal>
  );
}
